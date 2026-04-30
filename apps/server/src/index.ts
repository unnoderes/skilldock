import cors from "@fastify/cors";
import { execa } from "execa";
import Fastify from "fastify";
import { z, ZodError } from "zod";
import type {
  AppStatus,
  CliName,
  CommandResult,
  McpCommandResponse,
  SkillRecord,
  SkillsCommandResponse,
  SkillsListResponse,
} from "@skilldock/shared";

const server = Fastify({ logger: true });
await server.register(cors, { origin: true });

const PORT = Number(process.env.SKILLDOCK_SERVER_PORT ?? 3301);
const HOST = process.env.SKILLDOCK_SERVER_HOST ?? "127.0.0.1";

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

const mcpListQuerySchema = z.object({
  scope: scopeSchema.default("project"),
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

async function runCli(command: "npx", args: string[]): Promise<CommandResult> {
  const started = Date.now();
  try {
    const result = await execa(command, args, { reject: false, stripFinalNewline: false });
    return {
      command,
      args: redactArgs(args),
      exitCode: result.exitCode ?? 0,
      stdout: redact(result.stdout),
      stderr: redact(result.stderr),
      durationMs: Date.now() - started,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      command,
      args: redactArgs(args),
      exitCode: 1,
      stdout: "",
      stderr: redact(message),
      durationMs: Date.now() - started,
    };
  }
}

function pushRepeatedFlag(args: string[], flag: string, values: string[]): void {
  for (const value of values) {
    args.push(flag, value);
  }
}

async function cliStatus(name: CliName): Promise<AppStatus["cli"][number]> {
  const result = await runCli("npx", [name, "--version"]);
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

  request.log.error({ err: error }, "request failed");
  return reply.status(500).send({
    error: "INTERNAL_SERVER_ERROR",
    message: redact(error instanceof Error ? error.message : String(error)),
  });
});

server.get("/api/status", async (): Promise<AppStatus> => {
  const cli = await Promise.all([cliStatus("skills"), cliStatus("add-mcp")]);
  return {
    name: "SkillDock",
    ok: true,
    serverTime: new Date().toISOString(),
    cli,
  };
});

server.get("/api/skills/list", async (request): Promise<SkillsListResponse> => {
  const query = skillsListQuerySchema.parse(request.query);
  const args = ["skills", "list", "--json"];
  if (query.scope === "global") args.push("--global");
  const result = await runCli("npx", args);
  let skills: SkillRecord[] = [];
  if (result.exitCode === 0 && result.stdout.trim()) {
    skills = JSON.parse(result.stdout) as SkillRecord[];
  }
  return { result, skills };
});

server.post("/api/skills/install", async (request): Promise<SkillsCommandResponse> => {
  const body = skillsInstallBodySchema.parse(request.body);
  const args = ["skills", "add", body.packageName, "--yes"];

  if (body.scope === "global") args.push("--global");
  if (body.copy) args.push("--copy");
  if (body.all) args.push("--all");
  if (body.fullDepth) args.push("--full-depth");
  pushRepeatedFlag(args, "--agent", body.agents);
  pushRepeatedFlag(args, "--skill", body.skillNames);

  return { result: await runCli("npx", args) };
});

server.post("/api/skills/remove", async (request): Promise<SkillsCommandResponse> => {
  const body = skillsRemoveBodySchema.parse(request.body);
  const args = ["skills", "remove", "--yes"];

  if (body.scope === "global") args.push("--global");
  if (body.all) args.push("--all");
  args.push(...body.names);
  pushRepeatedFlag(args, "--agent", body.agents);
  pushRepeatedFlag(args, "--skill", body.skillNames);

  return { result: await runCli("npx", args) };
});

server.post("/api/skills/update", async (request): Promise<SkillsCommandResponse> => {
  const body = skillsUpdateBodySchema.parse(request.body);
  const args = ["skills", "update", "--yes", ...body.names];

  if (body.scope === "global") args.push("--global");
  if (body.scope === "project") args.push("--project");

  return { result: await runCli("npx", args) };
});

server.post("/api/skills/help", async (): Promise<CommandResult> => runCli("npx", ["skills", "--help"]));
server.post("/api/mcp/help", async (): Promise<CommandResult> => runCli("npx", ["add-mcp", "--help"]));
server.get("/api/mcp/list-agents", async (): Promise<CommandResult> => runCli("npx", ["add-mcp", "list-agents"]));
server.get("/api/mcp/list", async (request): Promise<CommandResult> => {
  const query = mcpListQuerySchema.parse(request.query);
  const args = ["add-mcp", "list"];
  if (query.scope === "global") args.push("--global");
  return runCli("npx", args);
});

server.post("/api/mcp/add", async (request): Promise<McpCommandResponse> => {
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

  return { result: await runCli("npx", args) };
});

server.get("/healthz", async () => ({ ok: true }));

await server.listen({ port: PORT, host: HOST });
