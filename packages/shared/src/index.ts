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

export type OperationLogEntry = {
  id: string;
  timestamp: string;
  source: string;
  result: CommandResult;
};

export type SkillRecord = {
  name: string;
  path?: string;
  scope?: Scope | string;
  agents?: string[];
};

export type SkillsListQuery = {
  scope?: Scope;
};

export type McpListQuery = {
  scope?: Scope;
};

export type SkillsListResponse = {
  result: CommandResult;
  skills: SkillRecord[];
};

export type SkillsInstallRequest = {
  packageName: string;
  scope?: Scope;
  agents?: string[];
  skillNames?: string[];
  copy?: boolean;
  all?: boolean;
  fullDepth?: boolean;
};

export type SkillsRemoveRequest = {
  names?: string[];
  scope?: Scope;
  agents?: string[];
  skillNames?: string[];
  all?: boolean;
};

export type SkillsUpdateRequest = {
  names?: string[];
  scope?: UpdateScope;
};

export type SkillsCommandResponse = {
  result: CommandResult;
};

export type McpAddRequest = {
  target: string;
  scope?: Scope;
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
