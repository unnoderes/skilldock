import type {
  AppStatus,
  CommandResult,
  LogsListResponse,
  McpAddRequest,
  ProjectAddRequest,
  ProjectSetActiveRequest,
  ProjectsResponse,
  Scope,
  SettingsResponse,
  SettingsUpdateRequest,
  SkillsFindResponse,
  SkillsInstallRequest,
  SkillsListResponse,
  SkillsRemoveRequest,
  SkillsUpdateRequest,
  TaskGetResponse,
  TaskStartResponse,
  TaskStreamEvent,
} from "@skilldock/shared";

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message: string }).message)
        : JSON.stringify(body);
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
    throw new ApiError(response.status, body);
  }

  return contentType.includes("application/json")
    ? (await response.json() as T)
    : (JSON.parse(await response.text()) as T);
}

function postJson<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function putJson<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Status
export function fetchStatus(): Promise<AppStatus> {
  return request<AppStatus>("/api/status");
}

// Settings
export function fetchSettings(): Promise<SettingsResponse> {
  return request<SettingsResponse>("/api/settings");
}

export function saveSettings(
  update: SettingsUpdateRequest,
): Promise<SettingsResponse> {
  return request<SettingsResponse>("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
}

// Projects
export function fetchProjects(): Promise<ProjectsResponse> {
  return request<ProjectsResponse>("/api/projects");
}

export function addProject(
  payload: ProjectAddRequest,
): Promise<ProjectsResponse> {
  return postJson<ProjectsResponse>("/api/projects", payload);
}

export function setActiveProject(
  payload: ProjectSetActiveRequest,
): Promise<ProjectsResponse> {
  return putJson<ProjectsResponse>("/api/projects/active", payload);
}

export function removeProject(projectId: string): Promise<ProjectsResponse> {
  return request<ProjectsResponse>(
    `/api/projects/${encodeURIComponent(projectId)}`,
    { method: "DELETE" },
  );
}

// Skills
export function fetchSkillsList(
  scope: Scope,
): Promise<SkillsListResponse> {
  return request<SkillsListResponse>(`/api/skills/list?scope=${scope}`);
}

export function installSkill(
  payload: SkillsInstallRequest,
): Promise<TaskStartResponse> {
  return postJson<TaskStartResponse>("/api/skills/install", payload);
}

export function removeSkill(
  payload: SkillsRemoveRequest,
): Promise<TaskStartResponse> {
  return postJson<TaskStartResponse>("/api/skills/remove", payload);
}

export function fetchSkillsFind(
  query: string,
): Promise<SkillsFindResponse> {
  return request<SkillsFindResponse>(
    `/api/skills/find?q=${encodeURIComponent(query)}`,
  );
}

export function updateSkill(
  payload: SkillsUpdateRequest,
): Promise<TaskStartResponse> {
  return postJson<TaskStartResponse>("/api/skills/update", payload);
}

// MCP
export function fetchMcpList(scope: Scope): Promise<CommandResult> {
  return request<CommandResult>(`/api/mcp/list?scope=${scope}`);
}

export function fetchMcpAgents(): Promise<CommandResult> {
  return request<CommandResult>("/api/mcp/list-agents");
}

export function addMcp(
  payload: McpAddRequest,
): Promise<TaskStartResponse> {
  return postJson<TaskStartResponse>("/api/mcp/add", payload);
}

// Tasks
export function fetchTask(taskId: string): Promise<TaskGetResponse> {
  return request<TaskGetResponse>(`/api/tasks/${taskId}`);
}

export function createTaskEventSource(
  taskId: string,
): EventSource {
  return new EventSource(`/api/tasks/${taskId}/stream`);
}

export type { TaskStreamEvent };

// Logs
export function fetchLogs(limit: number): Promise<LogsListResponse> {
  return request<LogsListResponse>(`/api/logs?limit=${limit}`);
}

export { ApiError };
