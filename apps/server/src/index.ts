import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { execa } from "execa";
import Fastify from "fastify";
import crypto from "node:crypto";
import { access, appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z, ZodError } from "zod";
import type {
  AppStatus,
  CliName,
  CommandResult,
  LogsListResponse,
  OperationLogEntry,
  SettingsResponse,
  SettingsUpdateRequest,
  SkillDockConfig,
  SkillRecord,
  SkillsFindResponse,
  SkillsListResponse,
  TaskGetResponse,
  TaskOutputChunk,
  TaskRecord,
  TaskStartResponse,
  TaskStreamEvent,
} from "@skilldock/shared";

const server = Fastify({ logger: process.env.SKILLDOCK_SERVER_LOGGER !== "false" });
await server.register(cors, { origin: true });

const PORT = Number(process.env.SKILLDOCK_SERVER_PORT ?? 3301);
const HOST = process.env.SKILLDOCK_SERVER_HOST ?? "127.0.0.1";
const SKILLDOCK_DIRECTORY = path.join(os.homedir(), ".skilldock");
const CONFIG_FILE_PATH = path.join(SKILLDOCK_DIRECTORY, "config.json");
const LOG_DIRECTORY = path.join(SKILLDOCK_DIRECTORY, "logs");
const LOG_FILE_PATH = path.join(LOG_DIRECTORY, "operations.jsonl");
const DEFAULT_LOG_LIMIT = 50;
const MAX_LOG_LIMIT = 100;
const MAX_TASKS = 100;
const MAX_TASK_OUTPUT_CHUNKS = 400;
let staticAssetsRegistered = false;

export type StartServerOptions = {
  host?: string;
  port?: number;
  staticRoot?: string;
};
const DEFAULT_SETTINGS_CONFIG: SkillDockConfig = {
  defaultSkillsScope: "project",
  defaultMcpScope: "project",
  defaultLogsLimit: DEFAULT_LOG_LIMIT,
  collapseRawOutput: true,
};

const scopeSchema = z.enum(["project", "global"]);
const updateScopeSchema = z.enum(["project", "global", "auto"]);
const packageNameSchema = z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9._/@:+-]+$/, "invalid package name");
const simpleValueSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._:@+/-]+$/, "invalid value");
const mcpTargetSchema = z.string().trim().min(1).max(500).refine((value) => !/[\r\n]/.test(value), "target must be a single line");
const serverNameSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._-]+$/, "invalid name");
const headerSchema = z.string().trim().min(3).max(500).refine((value) => /^[^:\s][^:]*:\s*.+$/.test(value), "header must match 'Key: Value'");
const envSchema = z.string().trim().min(3).max(500).regex(/^[A-Za-z_][A-Za-z0-9_]*=.+$/, "env must match KEY=VALUE");
const stringArray = <T extends z.ZodTypeAny>(schema: T, max = 20) => z.array(schema).max(max).default([]);

const skillsListQuerySchema = z.object({
  scope: scopeSchema.default("project"),
});

const queryParamSchema = z.string().trim().min(1).max(200).refine(
  (value) => !/[\x00-\x08\x0b\x0c\x0e-\x1f;|&`$(){}[\]<>!#~]/.test(value),
  "query contains invalid characters",
);

const skillsFindQuerySchema = z.object({
  q: queryParamSchema,
});

const mcpListQuerySchema = z.object({
  scope: scopeSchema.default("project"),
});

const logsListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(MAX_LOG_LIMIT).optional(),
});

const settingsFileSchema = z.object({
  defaultSkillsScope: scopeSchema.default(DEFAULT_SETTINGS_CONFIG.defaultSkillsScope),
  defaultMcpScope: scopeSchema.default(DEFAULT_SETTINGS_CONFIG.defaultMcpScope),
  defaultLogsLimit: z.number().int().min(1).max(MAX_LOG_LIMIT).default(DEFAULT_SETTINGS_CONFIG.defaultLogsLimit),
  collapseRawOutput: z.boolean().default(DEFAULT_SETTINGS_CONFIG.collapseRawOutput),
});

const settingsUpdateBodySchema = settingsFileSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "provide at least one settings field" },
);

const taskParamsSchema = z.object({
  id: z.string().uuid(),
});

const skillsInstallBodySchema = z.object({
  packageName: packageNameSchema,
  scope: scopeSchema.default("project"),
  agents: stringArray(simpleValueSchema),
  skillNames: stringArray(simpleValueSchema, 50),
  copy: z.boolean().default(false),
  all: z.boolean().default(false),
  fullDepth: z.boolean().default(false),
}).superRefine((value, ctx) => {
  if (value.all && (value.agents.length > 0 || value.skillNames.length > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["all"],
      message: "all cannot be combined with agents or skillNames",
    });
  }
});

const skillsRemoveBodySchema = z.object({
  names: stringArray(simpleValueSchema, 50),
  scope: scopeSchema.default("project"),
  agents: stringArray(simpleValueSchema),
  skillNames: stringArray(simpleValueSchema, 50),
  all: z.boolean().default(false),
}).superRefine((value, ctx) => {
  if (!value.all && value.names.length === 0 && value.skillNames.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["names"],
      message: "provide names, skillNames, or set all=true",
    });
  }
  if (value.all && (value.names.length > 0 || value.skillNames.length > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["all"],
      message: "all cannot be combined with names or skillNames",
    });
  }
});

const skillsUpdateBodySchema = z.object({
  names: stringArray(simpleValueSchema, 50),
  scope: updateScopeSchema.default("auto"),
});

const mcpAddBodySchema = z.object({
  target: mcpTargetSchema,
  scope: scopeSchema.default("project"),
  agents: stringArray(simpleValueSchema),
  name: serverNameSchema.optional(),
  transport: z.enum(["http", "sse"]).optional(),
  headers: stringArray(headerSchema, 20),
  env: stringArray(envSchema, 20),
  all: z.boolean().default(false),
  gitignore: z.boolean().default(false),
}).superRefine((value, ctx) => {
  if (value.all && value.agents.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["all"],
      message: "all cannot be combined with agents",
    });
  }
});

const secretPatterns = [
  /(sk-[A-Za-z0-9_-]{8,})/g,
  /(sk-ant-[A-Za-z0-9_-]{8,})/g,
  /(ghp_[A-Za-z0-9_]{8,})/g,
  /(xox[baprs]-[A-Za-z0-9-]{8,})/g,
  /((?:api[-_]?key|token|secret|password)\s*[:=]\s*)[^\s,;]+/gi,
  /((?:--env\s+)?[A-Za-z_][A-Za-z0-9_]*(?:token|key|secret|password)[A-Za-z0-9_]*=)[^\s]+/gi,
];

function redact(value: string): string {
  return secretPatterns.reduce(
    (text, pattern) => text.replace(pattern, (_match, prefix) => {
      if (typeof prefix === "string" && /[:=]\s*$/.test(prefix)) return `${prefix}[REDACTED]`;
      return "[REDACTED]";
    }),
    value,
  );
}

function redactArgs(args: string[]): string[] {
  return args.map((arg) => redact(arg));
}

async function ensureLogDirectory(): Promise<void> {
  await mkdir(LOG_DIRECTORY, { recursive: true });
}

async function ensureSkillDockDirectory(): Promise<void> {
  await mkdir(SKILLDOCK_DIRECTORY, { recursive: true });
}

async function appendOperationLog(entry: OperationLogEntry): Promise<OperationLogEntry> {
  await ensureLogDirectory();
  await appendFile(LOG_FILE_PATH, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

async function persistOperationLog(source: string, result: CommandResult): Promise<OperationLogEntry | undefined> {
  const entry: OperationLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source,
    result,
  };

  try {
    return await appendOperationLog(entry);
  } catch (error) {
    server.log.error({ err: error, source }, "failed to persist operation log");
    return undefined;
  }
}

async function readRecentOperationLogs(limit: number): Promise<OperationLogEntry[]> {
  try {
    const content = await readFile(LOG_FILE_PATH, "utf8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as OperationLogEntry];
        } catch {
          return [];
        }
      })
      .slice(-limit)
      .reverse();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

type ConfigReadResult = {
  config: SkillDockConfig;
  status: SettingsResponse["metadata"]["configStatus"];
};

async function readSkillDockConfig(): Promise<ConfigReadResult> {
  try {
    const content = await readFile(CONFIG_FILE_PATH, "utf8");
    const parsed = JSON.parse(content) as unknown;
    const config = settingsFileSchema.parse(parsed);
    return { config, status: "loaded" };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return { config: DEFAULT_SETTINGS_CONFIG, status: "default" };
    }
    if (error instanceof SyntaxError || error instanceof ZodError) {
      server.log.warn({ err: error, configPath: CONFIG_FILE_PATH }, "invalid skilldock config, using defaults");
      return { config: DEFAULT_SETTINGS_CONFIG, status: "invalid" };
    }
    throw error;
  }
}

function buildSettingsResponse(readResult: ConfigReadResult): SettingsResponse {
  return {
    config: readResult.config,
    metadata: {
      configPath: CONFIG_FILE_PATH,
      logPath: LOG_FILE_PATH,
      cliCommands: {
        skills: "npx skills",
        addMcp: "npx add-mcp",
      },
      configStatus: readResult.status,
    },
  };
}

async function writeSkillDockConfig(update: SettingsUpdateRequest): Promise<SettingsResponse> {
  const current = await readSkillDockConfig();
  const merged = settingsFileSchema.parse({
    ...current.config,
    ...update,
  });

  await ensureSkillDockDirectory();
  await writeFile(CONFIG_FILE_PATH, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  return buildSettingsResponse({ config: merged, status: "loaded" });
}

function cloneTask(task: TaskRecord): TaskRecord {
  return {
    ...task,
    output: task.output.map((chunk) => ({ ...chunk })),
    result: task.result ? { ...task.result, args: [...task.result.args] } : undefined,
  };
}

type RunCliOptions = {
  persistLog?: boolean;
};

async function runCli(
  command: "npx",
  args: string[],
  source = "unknown",
  options: RunCliOptions = {},
): Promise<CommandResult> {
  const started = Date.now();
  let result: CommandResult;
  try {
    const execution = await execa(command, args, { reject: false, stripFinalNewline: false });
    result = {
      command,
      args: redactArgs(args),
      exitCode: execution.exitCode ?? 0,
      stdout: redact(execution.stdout),
      stderr: redact(execution.stderr),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result = {
      command,
      args: redactArgs(args),
      exitCode: 1,
      stdout: "",
      stderr: redact(message),
      durationMs: Date.now() - started,
    };
  }

  if (options.persistLog !== false) {
    await persistOperationLog(source, result);
  }
  return result;
}

const tasks = new Map<string, TaskRecord>();
const taskSubscribers = new Map<string, Set<(event: TaskStreamEvent) => void>>();

function pruneTasks(): void {
  while (tasks.size > MAX_TASKS) {
    const oldestId = tasks.keys().next().value;
    if (!oldestId) return;
    tasks.delete(oldestId);
    taskSubscribers.delete(oldestId);
  }
}

function getTaskOrThrow(id: string): TaskRecord {
  const task = tasks.get(id);
  if (!task) {
    const error = new Error(`task ${id} not found`);
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }
  return task;
}

function emitTaskEvent(taskId: string, event: TaskStreamEvent): void {
  const listeners = taskSubscribers.get(taskId);
  if (!listeners?.size) return;
  for (const listener of listeners) {
    listener(event);
  }
}

function updateTask(taskId: string, updater: (task: TaskRecord) => void): TaskRecord {
  const task = getTaskOrThrow(taskId);
  updater(task);
  pruneTasks();
  emitTaskEvent(taskId, { type: "status", task: cloneTask(task) });
  return task;
}

function createTask(source: string): TaskRecord {
  const task: TaskRecord = {
    id: crypto.randomUUID(),
    source,
    status: "queued",
    createdAt: new Date().toISOString(),
    output: [],
  };
  tasks.set(task.id, task);
  pruneTasks();
  return task;
}

function appendTaskChunk(taskId: string, stream: TaskOutputChunk["stream"], text: string): void {
  const redactedText = redact(text);
  if (!redactedText) return;

  const task = getTaskOrThrow(taskId);
  const chunk: TaskOutputChunk = {
    timestamp: new Date().toISOString(),
    stream,
    text: redactedText,
  };

  task.output.push(chunk);
  if (task.output.length > MAX_TASK_OUTPUT_CHUNKS) {
    task.output.splice(0, task.output.length - MAX_TASK_OUTPUT_CHUNKS);
  }

  emitTaskEvent(taskId, { type: "chunk", taskId, chunk });
}

function subscribeToTask(taskId: string, listener: (event: TaskStreamEvent) => void): () => void {
  const listeners = taskSubscribers.get(taskId) ?? new Set();
  listeners.add(listener);
  taskSubscribers.set(taskId, listeners);
  return () => {
    const current = taskSubscribers.get(taskId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      taskSubscribers.delete(taskId);
    }
  };
}

async function runCliTask(command: "npx", args: string[], source: string, taskId: string): Promise<void> {
  updateTask(taskId, (task) => {
    task.status = "running";
    task.startedAt = new Date().toISOString();
  });
  appendTaskChunk(taskId, "system", `Starting ${command} ${redactArgs(args).join(" ")}`);

  const started = Date.now();
  let result: CommandResult;

  try {
    const subprocess = execa(command, args, {
      reject: false,
      stripFinalNewline: false,
    });

    subprocess.stdout?.on("data", (chunk) => appendTaskChunk(taskId, "stdout", String(chunk)));
    subprocess.stderr?.on("data", (chunk) => appendTaskChunk(taskId, "stderr", String(chunk)));

    const execution = await subprocess;
    result = {
      command,
      args: redactArgs(args),
      exitCode: execution.exitCode ?? 0,
      stdout: redact(execution.stdout),
      stderr: redact(execution.stderr),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result = {
      command,
      args: redactArgs(args),
      exitCode: 1,
      stdout: "",
      stderr: redact(message),
      durationMs: Date.now() - started,
    };
    appendTaskChunk(taskId, "system", `Execution error: ${result.stderr}`);
  }

  const logEntry = await persistOperationLog(source, result);

  updateTask(taskId, (task) => {
    task.result = result;
    task.operationLogId = logEntry?.id;
    task.finishedAt = new Date().toISOString();
    task.status = result.exitCode === 0 ? "succeeded" : "failed";
    task.error = result.exitCode === 0 ? undefined : result.stderr || result.stdout || `command failed with exit code ${result.exitCode}`;
  });
}

function startTask(command: "npx", args: string[], source: string): TaskStartResponse {
  const task = createTask(source);
  void runCliTask(command, args, source, task.id).catch((error) => {
    const message = redact(error instanceof Error ? error.message : String(error));
    server.log.error({ err: error, taskId: task.id, source }, "task execution failed unexpectedly");
    appendTaskChunk(task.id, "system", `Unexpected failure: ${message}`);
    updateTask(task.id, (current) => {
      current.status = "failed";
      current.finishedAt = new Date().toISOString();
      current.error = message;
      current.result ??= {
        command,
        args: redactArgs(args),
        exitCode: 1,
        stdout: "",
        stderr: message,
        durationMs: 0,
      };
    });
  });
  return { taskId: task.id };
}

function pushRepeatedFlag(args: string[], flag: string, values: string[]): void {
  for (const value of values) {
    args.push(flag, value);
  }
}

async function cliStatus(name: CliName): Promise<AppStatus["cli"][number]> {
  const result = await runCli("npx", [name, "--version"], `GET /api/status (${name})`, { persistLog: false });
  const version = result.stdout.trim() || result.stderr.trim();
  return {
    name,
    available: result.exitCode === 0,
    version: result.exitCode === 0 ? version : undefined,
    error: result.exitCode === 0 ? undefined : result.stderr || result.stdout,
  };
}

server.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: "INVALID_REQUEST",
      issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }

  const statusCode = (error as Error & { statusCode?: number }).statusCode;
  if (statusCode === 404) {
    return reply.status(404).send({
      error: "NOT_FOUND",
      message: redact(error instanceof Error ? error.message : String(error)),
    });
  }

  request.log.error({ err: error }, "request failed");
  return reply.status(500).send({
    error: "INTERNAL_SERVER_ERROR",
    message: redact(error instanceof Error ? error.message : String(error)),
  });
});

server.get("/api/status", async (): Promise<AppStatus> => {
  const cli = await Promise.all([
    cliStatus("skills"),
    cliStatus("add-mcp"),
  ]);
  return {
    name: "SkillDock",
    ok: true,
    serverTime: new Date().toISOString(),
    cli,
  };
});

server.get("/api/settings", async (): Promise<SettingsResponse> => buildSettingsResponse(await readSkillDockConfig()));

server.put("/api/settings", async (request): Promise<SettingsResponse> => {
  const body = settingsUpdateBodySchema.parse(request.body);
  return writeSkillDockConfig(body);
});

server.get("/api/skills/list", async (request): Promise<SkillsListResponse> => {
  const query = skillsListQuerySchema.parse(request.query);
  const args = ["skills", "list", "--json"];
  if (query.scope === "global") args.push("--global");
  const result = await runCli("npx", args, "GET /api/skills/list");
  let skills: SkillRecord[] = [];
  if (result.exitCode === 0 && result.stdout.trim()) {
    skills = JSON.parse(result.stdout) as SkillRecord[];
  }
  return { result, skills };
});

server.get("/api/skills/find", async (request): Promise<SkillsFindResponse> => {
  const { q } = skillsFindQuerySchema.parse(request.query);
  const result = await runCli("npx", ["skills", "find", q], "GET /api/skills/find");
  return { result };
});

server.post("/api/skills/install", async (request): Promise<TaskStartResponse> => {
  const body = skillsInstallBodySchema.parse(request.body);
  const args = ["skills", "add", body.packageName, "--yes"];

  if (body.scope === "global") args.push("--global");
  if (body.copy) args.push("--copy");
  if (body.all) args.push("--all");
  if (body.fullDepth) args.push("--full-depth");
  pushRepeatedFlag(args, "--agent", body.agents);
  pushRepeatedFlag(args, "--skill", body.skillNames);

  return startTask("npx", args, "POST /api/skills/install");
});

server.post("/api/skills/remove", async (request): Promise<TaskStartResponse> => {
  const body = skillsRemoveBodySchema.parse(request.body);
  const args = ["skills", "remove", "--yes"];

  if (body.scope === "global") args.push("--global");
  if (body.all) args.push("--all");
  args.push(...body.names);
  pushRepeatedFlag(args, "--agent", body.agents);
  pushRepeatedFlag(args, "--skill", body.skillNames);

  return startTask("npx", args, "POST /api/skills/remove");
});

server.post("/api/skills/update", async (request): Promise<TaskStartResponse> => {
  const body = skillsUpdateBodySchema.parse(request.body);
  const args = ["skills", "update", "--yes", ...body.names];

  if (body.scope === "global") args.push("--global");
  if (body.scope === "project") args.push("--project");

  return startTask("npx", args, "POST /api/skills/update");
});

server.post("/api/skills/help", async (): Promise<CommandResult> => runCli("npx", ["skills", "--help"], "POST /api/skills/help"));
server.post("/api/mcp/help", async (): Promise<CommandResult> => runCli("npx", ["add-mcp", "--help"], "POST /api/mcp/help"));
server.get("/api/mcp/list-agents", async (): Promise<CommandResult> => runCli("npx", ["add-mcp", "list-agents"], "GET /api/mcp/list-agents"));
server.get("/api/mcp/list", async (request): Promise<CommandResult> => {
  const query = mcpListQuerySchema.parse(request.query);
  const args = ["add-mcp", "list"];
  if (query.scope === "global") args.push("--global");
  return runCli("npx", args, "GET /api/mcp/list");
});

server.post("/api/mcp/add", async (request): Promise<TaskStartResponse> => {
  const body = mcpAddBodySchema.parse(request.body);
  const args = ["add-mcp", body.target, "--yes"];

  if (body.scope === "global") args.push("--global");
  if (body.name) args.push("--name", body.name);
  if (body.transport) args.push("--transport", body.transport);
  if (body.all) args.push("--all");
  if (body.gitignore) args.push("--gitignore");
  pushRepeatedFlag(args, "--agent", body.agents);
  pushRepeatedFlag(args, "--header", body.headers);
  pushRepeatedFlag(args, "--env", body.env);

  return startTask("npx", args, "POST /api/mcp/add");
});

server.get("/api/tasks/:id", async (request): Promise<TaskGetResponse> => {
  const { id } = taskParamsSchema.parse(request.params);
  return { task: cloneTask(getTaskOrThrow(id)) };
});

server.get("/api/tasks/:id/stream", async (request, reply) => {
  const { id } = taskParamsSchema.parse(request.params);
  const task = getTaskOrThrow(id);

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const sendEvent = (event: TaskStreamEvent) => {
    reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  sendEvent({ type: "snapshot", task: cloneTask(task) });
  const heartbeat = setInterval(() => {
    reply.raw.write(": keep-alive\n\n");
  }, 15000);

  const unsubscribe = subscribeToTask(id, sendEvent);
  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe();
  };

  request.raw.on("close", cleanup);
  request.raw.on("end", cleanup);
});

server.get("/api/logs", async (request): Promise<LogsListResponse> => {
  const query = logsListQuerySchema.parse(request.query);
  const { config } = await readSkillDockConfig();
  return {
    logs: await readRecentOperationLogs(query.limit ?? config.defaultLogsLimit),
  };
});

server.get("/healthz", async () => ({ ok: true }));

async function registerStaticAssets(staticRoot?: string): Promise<void> {
  if (!staticRoot || staticAssetsRegistered) return;

  const root = path.resolve(staticRoot);
  await access(path.join(root, "index.html"));
  await server.register(fastifyStatic, {
    root,
    prefix: "/",
    index: ["index.html"],
  });
  staticAssetsRegistered = true;
}

export async function startServer(options: StartServerOptions = {}): Promise<string> {
  await registerStaticAssets(options.staticRoot);
  return server.listen({
    port: options.port ?? PORT,
    host: options.host ?? HOST,
  });
}

export { server };

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : undefined;
const currentFile = fileURLToPath(import.meta.url);

if (entryFile === currentFile) {
  await startServer();
}
