export type CliName = "skills" | "add-mcp";

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

export type SkillRecord = {
  name: string;
  path?: string;
  scope?: "project" | "global" | string;
  agents?: string[];
};
