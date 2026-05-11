export type CliName = "skills" | "add-mcp";
export type Scope = "project" | "global";
export type UpdateScope = Scope | "auto";

export type CliStatus = {
  name: CliName;
  available: boolean;
  version?: string;
  error?: string;
};

export type AppStatus = {
  name: "SkillDock";
  ok: boolean;
  serverTime: string;
  cli: CliStatus[];
};

export type CommandResult = {
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export type ProjectStatus = "valid" | "missing" | "not-directory" | "inaccessible";

export type ProjectRecord = {
  id: string;
  name: string;
  path: string;
  status: ProjectStatus;
  isLaunchProject: boolean;
  addedAt: string;
  lastUsedAt: string;
  lastValidatedAt: string;
};

export type ProjectsResponse = {
  projects: ProjectRecord[];
  activeProjectId: string;
  launchProjectId: string;
};

export type ProjectAddRequest = {
  path: string;
  makeActive?: boolean;
};

export type ProjectSetActiveRequest = {
  projectId: string;
};

export type ProjectContext = {
  projectId: string;
  projectName: string;
  projectPath: string;
};

export type OperationLogEntry = {
  id: string;
  timestamp: string;
  source: string;
  project?: ProjectContext;
  scope?: Scope | UpdateScope;
  result: CommandResult;
};

export type TaskStatus = "queued" | "running" | "succeeded" | "failed";

export type TaskOutputChunk = {
  timestamp: string;
  stream: "stdout" | "stderr" | "system";
  text: string;
};

export type TaskRecord = {
  id: string;
  source: string;
  project?: ProjectContext;
  scope?: Scope | UpdateScope;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  output: TaskOutputChunk[];
  result?: CommandResult;
  error?: string;
  operationLogId?: string;
};

export type TaskStartResponse = {
  taskId: string;
};

export type TaskGetResponse = {
  task: TaskRecord;
};

export type TaskStreamEvent =
  | { type: "snapshot"; task: TaskRecord }
  | { type: "chunk"; taskId: string; chunk: TaskOutputChunk }
  | { type: "status"; task: TaskRecord };

export type SkillRecord = {
  name: string;
  path?: string;
  scope?: Scope | string;
  agents?: string[];
};

export type SkillsListQuery = {
  scope?: Scope;
  projectId?: string;
};

export type McpListQuery = {
  scope?: Scope;
  projectId?: string;
};

export type SkillsListResponse = {
  result: CommandResult;
  skills: SkillRecord[];
};

export type SkillsInstallRequest = {
  packageName: string;
  scope?: Scope;
  projectId?: string;
  agents?: string[];
  skillNames?: string[];
  copy?: boolean;
  all?: boolean;
  fullDepth?: boolean;
};

export type SkillsRemoveRequest = {
  names?: string[];
  scope?: Scope;
  projectId?: string;
  agents?: string[];
  skillNames?: string[];
  all?: boolean;
};

export type SkillsUpdateRequest = {
  names?: string[];
  scope?: UpdateScope;
  projectId?: string;
};

export type SkillsFindQuery = {
  query: string;
};

export type SkillsFindResponse = {
  result: CommandResult;
};

export type SkillsCommandResponse = {
  result: CommandResult;
};

export type McpAddRequest = {
  target: string;
  scope?: Scope;
  projectId?: string;
  agents?: string[];
  name?: string;
  transport?: "http" | "sse";
  headers?: string[];
  env?: string[];
  all?: boolean;
  gitignore?: boolean;
};

export type McpCommandResponse = {
  result: CommandResult;
};

export type LogsListQuery = {
  limit?: number;
};

export type LogsListResponse = {
  logs: OperationLogEntry[];
};

export type SkillDockConfig = {
  defaultSkillsScope: Scope;
  defaultMcpScope: Scope;
  defaultLogsLimit: number;
  collapseRawOutput: boolean;
  activeProjectId?: string;
};

export type SettingsMetadata = {
  configPath: string;
  logPath: string;
  projectsPath: string;
  cliCommands: {
    skills: "npx skills";
    addMcp: "npx add-mcp";
  };
  configStatus: "default" | "loaded" | "invalid";
};

export type SettingsResponse = {
  config: SkillDockConfig;
  metadata: SettingsMetadata;
};

export type SettingsUpdateRequest = Partial<Omit<SkillDockConfig, "activeProjectId">>;
