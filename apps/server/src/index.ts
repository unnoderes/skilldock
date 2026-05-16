import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { execa } from "execa";
import Fastify from "fastify";
import crypto from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { access, appendFile, mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z, ZodError } from "zod";
import type {
  AppStatus,
  CliName,
  CommandResult,
  LogsClearResponse,
  LogsListResponse,
  OperationLogEntry,
  ProjectAddRequest,
  ProjectContext,
  ProjectRecord,
  ProjectSetActiveRequest,
  ProjectStatus,
  ProjectsResponse,
  SettingsResponse,
  SettingsUpdateRequest,
  SkillDockConfig,
  SkillRecord,
  SkillsFindResponse,
  SkillsListResponse,
  Scope,
  TaskGetResponse,
  TaskOutputChunk,
  TaskRecord,
  TaskStartResponse,
  TaskStreamEvent,
  UpdateScope,
} from "@skilldock/shared";

const server = Fastify({ logger: process.env.SKILLDOCK_SERVER_LOGGER !== "false" });
await server.register(cors, { origin: true });

const PORT = Number(process.env.SKILLDOCK_SERVER_PORT ?? 3301);
const HOST = process.env.SKILLDOCK_SERVER_HOST ?? "127.0.0.1";
const SKILLDOCK_DIRECTORY = path.join(os.homedir(), ".skilldock");
const CONFIG_FILE_PATH = path.join(SKILLDOCK_DIRECTORY, "config.json");
const PROJECTS_FILE_PATH = path.join(SKILLDOCK_DIRECTORY, "projects.json");
const LOG_DIRECTORY = path.join(SKILLDOCK_DIRECTORY, "logs");
const LOG_FILE_PATH = path.join(LOG_DIRECTORY, "operations.jsonl");
const LAUNCH_PROJECT_PATH = process.cwd();
const DEFAULT_LOG_LIMIT = 50;
const DEFAULT_LOG_PAGE = 1;
const DEFAULT_LOG_PAGE_SIZE = 20;
const ALLOWED_LOG_PAGE_SIZES = [10, 20, 50, 100] as const;
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
const projectStatusSchema = z.enum(["valid", "missing", "not-directory", "inaccessible"]);
const packageNameSchema = z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9._/@:+-]+$/, "invalid package name");
const simpleValueSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._:@+/-]+$/, "invalid value");
const mcpTargetSchema = z.string().trim().min(1).max(500).refine((value) => !/[\r\n]/.test(value), "target must be a single line");
const serverNameSchema = z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9._-]+$/, "invalid name");
const headerSchema = z.string().trim().min(3).max(500).refine((value) => /^[^:\s][^:]*:\s*.+$/.test(value), "header must match 'Key: Value'");
const envSchema = z.string().trim().min(3).max(500).regex(/^[A-Za-z_][A-Za-z0-9_]*=.+$/, "env must match KEY=VALUE");
const stringArray = <T extends z.ZodTypeAny>(schema: T, max = 20) => z.array(schema).max(max).default([]);
const projectIdSchema = z.string().trim().min(1).max(200);

const skillsListQuerySchema = z.object({
  scope: scopeSchema.default("project"),
  projectId: projectIdSchema.optional(),
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
  projectId: projectIdSchema.optional(),
});

const logsListQuerySchema = z.object({
  page: z.coerce.number().int().optional().catch(DEFAULT_LOG_PAGE),
  pageSize: z.coerce.number().int().optional().catch(undefined),
  q: z.string().trim().max(500).optional().catch(undefined),
  limit: z.coerce.number().int().min(1).max(MAX_LOG_LIMIT).optional().catch(undefined),
});

const projectRecordSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  path: z.string().trim().min(1),
  status: projectStatusSchema,
  isLaunchProject: z.boolean(),
  addedAt: z.string().trim().min(1),
  lastUsedAt: z.string().trim().min(1),
  lastValidatedAt: z.string().trim().min(1),
});

const projectsRegistrySchema = z.object({
  projects: z.array(projectRecordSchema).default([]),
});

const settingsFileSchema = z.object({
  defaultSkillsScope: scopeSchema.default(DEFAULT_SETTINGS_CONFIG.defaultSkillsScope),
  defaultMcpScope: scopeSchema.default(DEFAULT_SETTINGS_CONFIG.defaultMcpScope),
  defaultLogsLimit: z.number().int().min(1).max(MAX_LOG_LIMIT).default(DEFAULT_SETTINGS_CONFIG.defaultLogsLimit),
  collapseRawOutput: z.boolean().default(DEFAULT_SETTINGS_CONFIG.collapseRawOutput),
  activeProjectId: z.string().trim().min(1).optional(),
});

const settingsUpdateBodySchema = settingsFileSchema.omit({ activeProjectId: true }).partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "provide at least one settings field" },
);

const taskParamsSchema = z.object({
  id: z.string().uuid(),
});

const projectParamsSchema = z.object({
  id: projectIdSchema,
});

const projectAddBodySchema = z.object({
  path: z.string().trim().min(1),
  makeActive: z.boolean().default(true),
});

const projectSetActiveBodySchema = z.object({
  projectId: z.string().trim().min(1),
});

const skillsInstallBodySchema = z.object({
  packageName: packageNameSchema,
  scope: scopeSchema.default("project"),
  projectId: projectIdSchema.optional(),
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
  projectId: projectIdSchema.optional(),
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
  projectId: projectIdSchema.optional(),
});

const mcpAddBodySchema = z.object({
  target: mcpTargetSchema,
  scope: scopeSchema.default("project"),
  projectId: projectIdSchema.optional(),
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

class ApiError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

type ProjectsRegistry = z.infer<typeof projectsRegistrySchema>;

type ProjectsState = {
  projects: ProjectRecord[];
  activeProjectId: string;
  launchProjectId: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function createApiError(statusCode: number, code: string, message: string): ApiError {
  return new ApiError(statusCode, code, message);
}

function buildProjectId(projectPath: string): string {
  return crypto.createHash("sha256").update(projectPath).digest("hex").slice(0, 16);
}

function deriveProjectName(projectPath: string): string {
  return path.basename(projectPath) || projectPath;
}

function compareProjects(a: ProjectRecord, b: ProjectRecord): number {
  if (a.isLaunchProject !== b.isLaunchProject) {
    return a.isLaunchProject ? -1 : 1;
  }

  const lastUsedDiff = b.lastUsedAt.localeCompare(a.lastUsedAt);
  if (lastUsedDiff !== 0) return lastUsedDiff;
  return a.name.localeCompare(b.name) || a.path.localeCompare(b.path);
}

function sortProjects(projects: ProjectRecord[]): ProjectRecord[] {
  return [...projects].sort(compareProjects);
}

function indexProjectsById(projects: ProjectRecord[]): Map<string, ProjectRecord> {
  const indexed = new Map<string, ProjectRecord>();
  for (const project of projects) {
    indexed.set(project.id, project);
  }
  return indexed;
}

function dedupeProjects(projects: ProjectRecord[]): ProjectRecord[] {
  return [...indexProjectsById(projects).values()];
}

function updateProjectInList(projects: ProjectRecord[], nextProject: ProjectRecord): ProjectRecord[] {
  const nextProjects = projects.map((project) => (project.id === nextProject.id ? nextProject : project));
  if (!nextProjects.some((project) => project.id === nextProject.id)) {
    nextProjects.push(nextProject);
  }
  return nextProjects;
}

function touchProject(project: ProjectRecord, timestamp: string): ProjectRecord {
  return {
    ...project,
    lastUsedAt: timestamp,
  };
}

function normalizeLaunchFlags(projects: ProjectRecord[], launchProjectId: string): { projects: ProjectRecord[]; changed: boolean } {
  let changed = false;
  const nextProjects = projects.map((project) => {
    const shouldBeLaunchProject = project.id === launchProjectId;
    const nextName = deriveProjectName(project.path);

    if (project.isLaunchProject === shouldBeLaunchProject && project.name === nextName) {
      return project;
    }

    changed = true;
    return {
      ...project,
      isLaunchProject: shouldBeLaunchProject,
      name: nextName,
    };
  });

  return { projects: nextProjects, changed };
}

async function getProjectStatus(projectPath: string): Promise<ProjectStatus> {
  try {
    const stats = await stat(projectPath);
    if (!stats.isDirectory()) return "not-directory";
    await access(projectPath, fsConstants.R_OK | fsConstants.X_OK);
    return "valid";
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return "missing";
    if (code === "EACCES" || code === "EPERM") return "inaccessible";
    return "inaccessible";
  }
}

async function validateProjectPath(inputPath: string): Promise<string> {
  const trimmedPath = inputPath.trim();
  if (!path.isAbsolute(trimmedPath)) {
    throw createApiError(400, "INVALID_PROJECT_PATH", "project path must be absolute");
  }

  let canonicalPath: string;
  try {
    canonicalPath = await realpath(trimmedPath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw createApiError(400, "PROJECT_NOT_FOUND", "project path does not exist");
    }
    if (code === "EACCES" || code === "EPERM") {
      throw createApiError(400, "PROJECT_INACCESSIBLE", "project path is not accessible");
    }
    throw error;
  }

  let stats;
  try {
    stats = await stat(canonicalPath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw createApiError(400, "PROJECT_NOT_FOUND", "project path does not exist");
    }
    if (code === "EACCES" || code === "EPERM") {
      throw createApiError(400, "PROJECT_INACCESSIBLE", "project path is not accessible");
    }
    throw error;
  }

  if (!stats.isDirectory()) {
    throw createApiError(400, "PROJECT_NOT_DIRECTORY", "project path is not a directory");
  }

  try {
    await access(canonicalPath, fsConstants.R_OK | fsConstants.X_OK);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "EACCES" || code === "EPERM") {
      throw createApiError(400, "PROJECT_INACCESSIBLE", "project path is not accessible");
    }
    throw error;
  }

  return canonicalPath;
}

function createProjectRecord(
  projectPath: string,
  overrides: Partial<ProjectRecord> = {},
): ProjectRecord {
  const timestamp = overrides.lastValidatedAt ?? nowIso();
  return {
    id: overrides.id ?? buildProjectId(projectPath),
    name: overrides.name ?? deriveProjectName(projectPath),
    path: overrides.path ?? projectPath,
    status: overrides.status ?? "valid",
    isLaunchProject: overrides.isLaunchProject ?? false,
    addedAt: overrides.addedAt ?? timestamp,
    lastUsedAt: overrides.lastUsedAt ?? timestamp,
    lastValidatedAt: overrides.lastValidatedAt ?? timestamp,
  };
}

async function revalidateProject(project: ProjectRecord): Promise<ProjectRecord> {
  return {
    ...project,
    name: deriveProjectName(project.path),
    status: await getProjectStatus(project.path),
    lastValidatedAt: nowIso(),
  };
}

async function readProjectsRegistry(): Promise<ProjectsRegistry> {
  try {
    const content = await readFile(PROJECTS_FILE_PATH, "utf8");
    const parsed = JSON.parse(content) as unknown;
    return projectsRegistrySchema.parse(parsed);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return { projects: [] };
    }
    if (error instanceof SyntaxError || error instanceof ZodError) {
      server.log.warn({ err: error, projectsPath: PROJECTS_FILE_PATH }, "invalid projects registry, using empty registry");
      return { projects: [] };
    }
    throw error;
  }
}

async function writeProjectsRegistry(projects: ProjectRecord[]): Promise<void> {
  await ensureSkillDockDirectory();
  const registry = projectsRegistrySchema.parse({
    projects: sortProjects(projects),
  });
  await writeFile(PROJECTS_FILE_PATH, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
}

async function ensureLaunchProject(projects: ProjectRecord[]): Promise<{ projects: ProjectRecord[]; launchProjectId: string; changed: boolean }> {
  const launchProjectPath = await validateProjectPath(LAUNCH_PROJECT_PATH);
  const launchProjectId = buildProjectId(launchProjectPath);
  const timestamp = nowIso();
  const indexedProjects = indexProjectsById(projects);
  const existingLaunchProject = indexedProjects.get(launchProjectId);

  const { projects: normalizedProjects, changed: normalizedChanged } = normalizeLaunchFlags(projects, launchProjectId);

  if (existingLaunchProject) {
    const nextLaunchProject = createProjectRecord(launchProjectPath, {
      ...existingLaunchProject,
      path: launchProjectPath,
      isLaunchProject: true,
    });
    const launchChanged = JSON.stringify(existingLaunchProject) !== JSON.stringify(nextLaunchProject);
    return {
      projects: updateProjectInList(normalizedProjects, nextLaunchProject),
      launchProjectId,
      changed: normalizedChanged || launchChanged,
    };
  }

  return {
    projects: [
      ...normalizedProjects,
      createProjectRecord(launchProjectPath, {
        isLaunchProject: true,
        addedAt: timestamp,
        lastUsedAt: timestamp,
        lastValidatedAt: timestamp,
      }),
    ],
    launchProjectId,
    changed: true,
  };
}

async function resolveProjectsState(): Promise<ProjectsState> {
  const registry = await readProjectsRegistry();
  const launchResolved = await ensureLaunchProject(dedupeProjects(registry.projects));
  let projects = launchResolved.projects;
  let registryChanged = launchResolved.changed;

  const revalidatedProjects = await Promise.all(projects.map((project) => revalidateProject(project)));
  if (JSON.stringify(revalidatedProjects) !== JSON.stringify(projects)) {
    registryChanged = true;
  }
  projects = revalidatedProjects;

  const settingsRead = await readSkillDockConfig();
  const launchProject = projects.find((project) => project.id === launchResolved.launchProjectId);
  if (!launchProject) {
    throw new Error("launch project missing from registry");
  }

  const activeProject = settingsRead.config.activeProjectId
    ? projects.find((project) => project.id === settingsRead.config.activeProjectId)
    : undefined;
  const activeProjectId = activeProject?.status === "valid"
    ? activeProject.id
    : launchProject.id;

  if (settingsRead.config.activeProjectId !== activeProjectId) {
    await writeSkillDockConfig({ activeProjectId });
  }
  if (registryChanged) {
    await writeProjectsRegistry(projects);
  }

  return {
    projects: sortProjects(projects),
    activeProjectId,
    launchProjectId: launchProject.id,
  };
}

async function resolveProjectContext(projectId?: string): Promise<ProjectContext> {
  const currentState = await resolveProjectsState();
  const resolvedProjectId = projectId ?? currentState.activeProjectId;
  const project = currentState.projects.find((candidate) => candidate.id === resolvedProjectId);
  if (!project) {
    throw createApiError(404, "PROJECT_NOT_FOUND", "project not found");
  }

  const revalidatedProject = await revalidateProject(project);
  if (revalidatedProject.status !== "valid") {
    await writeProjectsRegistry(updateProjectInList(currentState.projects, revalidatedProject));
    throw createApiError(400, "PROJECT_INVALID", "project path is no longer accessible");
  }

  return {
    projectId: revalidatedProject.id,
    projectName: revalidatedProject.name,
    projectPath: revalidatedProject.path,
  };
}

async function appendOperationLog(entry: OperationLogEntry): Promise<OperationLogEntry> {
  await ensureLogDirectory();
  await appendFile(LOG_FILE_PATH, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

type CliExecutionMetadata = {
  project?: ProjectContext;
  scope?: Scope | UpdateScope;
};

async function persistOperationLog(
  source: string,
  result: CommandResult,
  metadata: CliExecutionMetadata = {},
): Promise<OperationLogEntry | undefined> {
  const entry: OperationLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source,
    project: metadata.project,
    scope: metadata.scope,
    result,
  };

  try {
    return await appendOperationLog(entry);
  } catch (error) {
    server.log.error({ err: error, source }, "failed to persist operation log");
    return undefined;
  }
}

async function readOperationLogs(): Promise<OperationLogEntry[]> {
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
      .reverse();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function clearOperationLogs(): Promise<LogsClearResponse> {
  const clearedCount = (await readOperationLogs()).length;
  await ensureLogDirectory();
  await writeFile(LOG_FILE_PATH, "", "utf8");
  return { cleared: true, clearedCount };
}

function resolveLogPageSize(pageSize?: number, limit?: number): number {
  const requestedPageSize = pageSize ?? limit ?? DEFAULT_LOG_PAGE_SIZE;
  return ALLOWED_LOG_PAGE_SIZES.includes(requestedPageSize as (typeof ALLOWED_LOG_PAGE_SIZES)[number])
    ? requestedPageSize
    : DEFAULT_LOG_PAGE_SIZE;
}

function searchOperationLogs(logs: OperationLogEntry[], query?: string): OperationLogEntry[] {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) return logs;

  return logs.filter((log) => JSON.stringify(log).toLowerCase().includes(normalizedQuery));
}

function paginateOperationLogs(logs: OperationLogEntry[], requestedPage: number, pageSize: number): LogsListResponse {
  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const positivePage = requestedPage > 0 ? requestedPage : DEFAULT_LOG_PAGE;
  const page = totalPages > 0 ? Math.min(positivePage, totalPages) : DEFAULT_LOG_PAGE;
  const startIndex = (page - 1) * pageSize;

  return {
    logs: logs.slice(startIndex, startIndex + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasPreviousPage: totalPages > 0 && page > 1,
      hasNextPage: totalPages > 0 && page < totalPages,
    },
  };
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
      projectsPath: PROJECTS_FILE_PATH,
      cliCommands: {
        skills: "npx skills",
        addMcp: "npx add-mcp",
      },
      configStatus: readResult.status,
    },
  };
}

async function writeSkillDockConfig(update: Partial<SkillDockConfig>): Promise<SettingsResponse> {
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
    project: task.project ? { ...task.project } : undefined,
    output: task.output.map((chunk) => ({ ...chunk })),
    result: task.result ? { ...task.result, args: [...task.result.args] } : undefined,
  };
}

type RunCliOptions = {
  persistLog?: boolean;
  cwd?: string;
} & CliExecutionMetadata;

async function runCli(
  command: "npx",
  args: string[],
  source = "unknown",
  options: RunCliOptions = {},
): Promise<CommandResult> {
  const started = Date.now();
  let result: CommandResult;
  try {
    const execution = await execa(command, args, {
      cwd: options.cwd,
      reject: false,
      stripFinalNewline: false,
    });
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
    await persistOperationLog(source, result, options);
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

function createTask(source: string, metadata: CliExecutionMetadata = {}): TaskRecord {
  const task: TaskRecord = {
    id: crypto.randomUUID(),
    source,
    project: metadata.project,
    scope: metadata.scope,
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

type RunCliTaskOptions = {
  cwd?: string;
} & CliExecutionMetadata;

async function runCliTask(
  command: "npx",
  args: string[],
  source: string,
  taskId: string,
  options: RunCliTaskOptions = {},
): Promise<void> {
  updateTask(taskId, (task) => {
    task.status = "running";
    task.startedAt = new Date().toISOString();
  });
  appendTaskChunk(taskId, "system", `Starting ${command} ${redactArgs(args).join(" ")}`);

  const started = Date.now();
  let result: CommandResult;

  try {
    const subprocess = execa(command, args, {
      cwd: options.cwd,
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

  const logEntry = await persistOperationLog(source, result, options);

  updateTask(taskId, (task) => {
    task.result = result;
    task.operationLogId = logEntry?.id;
    task.finishedAt = new Date().toISOString();
    task.status = result.exitCode === 0 ? "succeeded" : "failed";
    task.error = result.exitCode === 0 ? undefined : result.stderr || result.stdout || `command failed with exit code ${result.exitCode}`;
  });
}

function startTask(command: "npx", args: string[], source: string, options: RunCliTaskOptions = {}): TaskStartResponse {
  const task = createTask(source, options);
  void runCliTask(command, args, source, task.id, options).catch((error) => {
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

  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: redact(error.message),
    });
  }

  const statusCode = (error as Error & { statusCode?: number }).statusCode;
  if (statusCode === 404 || statusCode === 400) {
    return reply.status(statusCode).send({
      error: (error as Error & { code?: string }).code ?? (statusCode === 404 ? "NOT_FOUND" : "BAD_REQUEST"),
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

server.get("/api/projects", async (): Promise<ProjectsResponse> => resolveProjectsState());

server.post("/api/projects", async (request): Promise<ProjectsResponse> => {
  const body = projectAddBodySchema.parse(request.body) as ProjectAddRequest;
  const canonicalPath = await validateProjectPath(body.path);
  const currentState = await resolveProjectsState();
  const existingProject = currentState.projects.find((project) => project.id === buildProjectId(canonicalPath));
  const timestamp = nowIso();
  const nextProject = createProjectRecord(canonicalPath, {
    ...existingProject,
    path: canonicalPath,
    status: "valid",
    name: deriveProjectName(canonicalPath),
    lastUsedAt: timestamp,
    lastValidatedAt: timestamp,
  });

  await writeProjectsRegistry(updateProjectInList(currentState.projects, nextProject));
  if (body.makeActive !== false) {
    await writeSkillDockConfig({ activeProjectId: nextProject.id });
  }

  return resolveProjectsState();
});

server.put("/api/projects/active", async (request): Promise<ProjectsResponse> => {
  const body = projectSetActiveBodySchema.parse(request.body) as ProjectSetActiveRequest;
  const currentState = await resolveProjectsState();
  const existingProject = currentState.projects.find((project) => project.id === body.projectId);
  if (!existingProject) {
    throw createApiError(404, "PROJECT_NOT_FOUND", "project not found");
  }

  const revalidatedProject = await revalidateProject(existingProject);
  if (revalidatedProject.status !== "valid") {
    await writeProjectsRegistry(updateProjectInList(currentState.projects, revalidatedProject));
    throw createApiError(400, "PROJECT_INVALID", "project path is no longer accessible");
  }

  const nextProject = touchProject(revalidatedProject, nowIso());
  await writeProjectsRegistry(updateProjectInList(currentState.projects, nextProject));
  await writeSkillDockConfig({ activeProjectId: nextProject.id });
  return resolveProjectsState();
});

server.delete("/api/projects/:id", async (request): Promise<ProjectsResponse> => {
  const { id } = projectParamsSchema.parse(request.params);
  const currentState = await resolveProjectsState();
  const existingProject = currentState.projects.find((project) => project.id === id);
  if (!existingProject) {
    throw createApiError(404, "PROJECT_NOT_FOUND", "project not found");
  }
  if (existingProject.isLaunchProject) {
    throw createApiError(400, "INVALID_REQUEST", "launch project cannot be removed");
  }

  await writeProjectsRegistry(currentState.projects.filter((project) => project.id !== id));
  if (currentState.activeProjectId === id) {
    await writeSkillDockConfig({ activeProjectId: currentState.launchProjectId });
  }
  return resolveProjectsState();
});

server.get("/api/skills/list", async (request): Promise<SkillsListResponse> => {
  const query = skillsListQuerySchema.parse(request.query);
  const project = await resolveProjectContext(query.projectId);
  const args = ["skills", "list", "--json"];
  if (query.scope === "global") args.push("--global");
  const result = await runCli("npx", args, "GET /api/skills/list", {
    cwd: project.projectPath,
    project,
    scope: query.scope,
  });
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
  const project = await resolveProjectContext(body.projectId);
  const args = ["skills", "add", body.packageName, "--yes"];

  if (body.scope === "global") args.push("--global");
  if (body.copy) args.push("--copy");
  if (body.all) args.push("--all");
  if (body.fullDepth) args.push("--full-depth");
  pushRepeatedFlag(args, "--agent", body.agents);
  pushRepeatedFlag(args, "--skill", body.skillNames);

  return startTask("npx", args, "POST /api/skills/install", {
    cwd: project.projectPath,
    project,
    scope: body.scope,
  });
});

server.post("/api/skills/remove", async (request): Promise<TaskStartResponse> => {
  const body = skillsRemoveBodySchema.parse(request.body);
  const project = await resolveProjectContext(body.projectId);
  const args = ["skills", "remove", "--yes"];

  if (body.scope === "global") args.push("--global");
  if (body.all) args.push("--all");
  args.push(...body.names);
  pushRepeatedFlag(args, "--agent", body.agents);
  pushRepeatedFlag(args, "--skill", body.skillNames);

  return startTask("npx", args, "POST /api/skills/remove", {
    cwd: project.projectPath,
    project,
    scope: body.scope,
  });
});

server.post("/api/skills/update", async (request): Promise<TaskStartResponse> => {
  const body = skillsUpdateBodySchema.parse(request.body);
  const project = await resolveProjectContext(body.projectId);
  const args = ["skills", "update", "--yes", ...body.names];

  if (body.scope === "global") args.push("--global");
  if (body.scope === "project") args.push("--project");

  return startTask("npx", args, "POST /api/skills/update", {
    cwd: project.projectPath,
    project,
    scope: body.scope,
  });
});

server.post("/api/skills/help", async (): Promise<CommandResult> => runCli("npx", ["skills", "--help"], "POST /api/skills/help"));
server.post("/api/mcp/help", async (): Promise<CommandResult> => runCli("npx", ["add-mcp", "--help"], "POST /api/mcp/help"));
server.get("/api/mcp/list-agents", async (): Promise<CommandResult> => runCli("npx", ["add-mcp", "list-agents"], "GET /api/mcp/list-agents"));
server.get("/api/mcp/list", async (request): Promise<CommandResult> => {
  const query = mcpListQuerySchema.parse(request.query);
  const project = await resolveProjectContext(query.projectId);
  const args = ["add-mcp", "list"];
  if (query.scope === "global") args.push("--global");
  return runCli("npx", args, "GET /api/mcp/list", {
    cwd: project.projectPath,
    project,
    scope: query.scope,
  });
});

server.post("/api/mcp/add", async (request): Promise<TaskStartResponse> => {
  const body = mcpAddBodySchema.parse(request.body);
  const project = await resolveProjectContext(body.projectId);
  const args = ["add-mcp", body.target, "--yes"];

  if (body.scope === "global") args.push("--global");
  if (body.name) args.push("--name", body.name);
  if (body.transport) args.push("--transport", body.transport);
  if (body.all) args.push("--all");
  if (body.gitignore) args.push("--gitignore");
  pushRepeatedFlag(args, "--agent", body.agents);
  pushRepeatedFlag(args, "--header", body.headers);
  pushRepeatedFlag(args, "--env", body.env);

  return startTask("npx", args, "POST /api/mcp/add", {
    cwd: project.projectPath,
    project,
    scope: body.scope,
  });
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
  const pageSize = resolveLogPageSize(query.pageSize, query.limit);
  const logs = searchOperationLogs(await readOperationLogs(), query.q);
  return paginateOperationLogs(logs, query.page ?? DEFAULT_LOG_PAGE, pageSize);
});

server.post("/api/logs/clear", async (): Promise<LogsClearResponse> => clearOperationLogs());

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
