import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  AppStatus,
  CommandResult,
  LogsListResponse,
  OperationLogEntry,
  Scope,
  SettingsResponse,
  SettingsUpdateRequest,
  SkillRecord,
  SkillsListResponse,
  TaskGetResponse,
  TaskOutputChunk,
  TaskRecord,
  TaskStartResponse,
  TaskStreamEvent,
} from "@skilldock/shared";
import "./styles.css";

type ResultState = {
  title: string;
  result: CommandResult;
  error?: string;
};

type TaskViewState = {
  title: string;
  task: TaskRecord;
  transport: "sse" | "polling";
};

type InstallSkillPayload = {
  packageName: string;
  scope: Scope;
  agents: string[];
  skillNames: string[];
  copy: boolean;
  all: boolean;
  yes: true;
};

type RemoveSkillPayload = {
  scope: Scope;
  skillNames: string[];
  agents: string[];
  all: boolean;
  yes: true;
};

type UpdateSkillPayload = {
  scope: Scope;
  names: string[];
  yes: true;
};

type AddMcpPayload = {
  target: string;
  scope: Scope;
  agents: string[];
  name?: string;
  transport?: "http" | "sse";
  headers: string[];
  env: string[];
  all: boolean;
  gitignore: boolean;
  yes: true;
};

const DEFAULT_SCOPE: Scope = "project";
const DEFAULT_LOG_LIMIT = 50;
const MAX_LOG_LIMIT = 100;

const emptyResult: CommandResult = {
  command: "npx",
  args: [],
  exitCode: -1,
  stdout: "",
  stderr: "",
  durationMs: 0,
};

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function confirmWrite(title: string, details: string[]) {
  return window.confirm([title, "", ...details].join("\n"));
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const message = contentType.includes("application/json")
      ? JSON.stringify(await response.json())
      : await response.text();
    throw new Error(message || `${response.status} ${response.statusText}`);
  }

  return contentType.includes("application/json") ? await response.json() as T : JSON.parse(await response.text()) as T;
}

function normalizeResult(payload: unknown): CommandResult {
  if (!payload || typeof payload !== "object") return emptyResult;
  if ("result" in payload && payload.result && typeof payload.result === "object") {
    return payload.result as CommandResult;
  }
  return payload as CommandResult;
}

function mergeTaskChunk(task: TaskRecord, chunk: TaskOutputChunk): TaskRecord {
  const nextOutput = [...task.output, chunk];
  return { ...task, output: nextOutput };
}

function isTaskFinished(task: TaskRecord): boolean {
  return task.status === "succeeded" || task.status === "failed";
}

function formatTime(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function clipText(value: string, length = 240): string {
  const normalized = value.trim();
  if (!normalized) return "";
  return normalized.length > length ? `${normalized.slice(0, length)}…` : normalized;
}

function formatCommand(result: CommandResult): string {
  return [result.command, ...result.args].join(" ");
}

function getLogPreview(log: OperationLogEntry): string {
  return clipText(log.result.stderr || log.result.stdout || `exit ${log.result.exitCode}`);
}

function App() {
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);

  const [skillsScope, setSkillsScopeState] = useState<Scope>(DEFAULT_SCOPE);
  const [skills, setSkills] = useState<SkillsListResponse | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  const [mcpScope, setMcpScopeState] = useState<Scope>(DEFAULT_SCOPE);
  const [mcpList, setMcpList] = useState<CommandResult | null>(null);
  const [mcpAgents, setMcpAgents] = useState<CommandResult | null>(null);

  const [logs, setLogs] = useState<OperationLogEntry[]>([]);
  const [logsLimit, setLogsLimitState] = useState(DEFAULT_LOG_LIMIT);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsBusy, setLogsBusy] = useState(false);

  const [collapseRawOutput, setCollapseRawOutputState] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ResultState | null>(null);
  const [activeTask, setActiveTask] = useState<TaskViewState | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const initializedFromSettingsRef = useRef(false);
  const skillsScopeTouchedRef = useRef(false);
  const mcpScopeTouchedRef = useRef(false);
  const logsLimitTouchedRef = useRef(false);
  const collapsePreferenceTouchedRef = useRef(false);

  const [installPackageName, setInstallPackageName] = useState("");
  const [installAgents, setInstallAgents] = useState("");
  const [installSkills, setInstallSkills] = useState("");
  const [installCopy, setInstallCopy] = useState(false);
  const [installAll, setInstallAll] = useState(false);

  const [removeSkillNames, setRemoveSkillNames] = useState("");
  const [removeAgents, setRemoveAgents] = useState("");
  const [removeAll, setRemoveAll] = useState(false);

  const [updateSkillNames, setUpdateSkillNames] = useState("");

  const [mcpTarget, setMcpTarget] = useState("");
  const [mcpName, setMcpName] = useState("");
  const [mcpAgentsField, setMcpAgentsField] = useState("");
  const [mcpTransport, setMcpTransport] = useState<"" | "http" | "sse">("");
  const [mcpHeaders, setMcpHeaders] = useState("");
  const [mcpEnv, setMcpEnv] = useState("");
  const [mcpAll, setMcpAll] = useState(false);
  const [mcpGitignore, setMcpGitignore] = useState(true);

  const [settingsForm, setSettingsForm] = useState<SettingsUpdateRequest>({
    defaultSkillsScope: DEFAULT_SCOPE,
    defaultMcpScope: DEFAULT_SCOPE,
    defaultLogsLimit: DEFAULT_LOG_LIMIT,
    collapseRawOutput: true,
  });

  const skillCountLabel = useMemo(() => {
    if (!skills) return "加载中...";
    return `${skills.skills.length} 个 ${skillsScope === "project" ? "项目" : "全局"} Skills`;
  }, [skills, skillsScope]);

  const logLimitOptions = useMemo(() => {
    const values = new Set([5, 10, 20, 50, 100, settingsForm.defaultLogsLimit ?? DEFAULT_LOG_LIMIT, logsLimit]);
    return [...values].filter((value) => value >= 1 && value <= MAX_LOG_LIMIT).sort((left, right) => left - right);
  }, [logsLimit, settingsForm.defaultLogsLimit]);

  function setSkillsScope(scope: Scope, touched = true) {
    if (touched) skillsScopeTouchedRef.current = true;
    setSkillsScopeState(scope);
  }

  function setMcpScope(scope: Scope, touched = true) {
    if (touched) mcpScopeTouchedRef.current = true;
    setMcpScopeState(scope);
  }

  function setLogsLimit(limit: number, touched = true) {
    if (touched) logsLimitTouchedRef.current = true;
    setLogsLimitState(limit);
  }

  function setCollapseRawOutput(value: boolean, touched = true) {
    if (touched) collapsePreferenceTouchedRef.current = true;
    setCollapseRawOutputState(value);
  }

  function syncSettingsToForm(nextSettings: SettingsResponse) {
    setSettingsForm({
      defaultSkillsScope: nextSettings.config.defaultSkillsScope,
      defaultMcpScope: nextSettings.config.defaultMcpScope,
      defaultLogsLimit: nextSettings.config.defaultLogsLimit,
      collapseRawOutput: nextSettings.config.collapseRawOutput,
    });
  }

  function applySettingsDefaults(nextSettings: SettingsResponse) {
    if (!skillsScopeTouchedRef.current) {
      setSkillsScope(nextSettings.config.defaultSkillsScope, false);
    }
    if (!mcpScopeTouchedRef.current) {
      setMcpScope(nextSettings.config.defaultMcpScope, false);
    }
    if (!logsLimitTouchedRef.current) {
      setLogsLimit(nextSettings.config.defaultLogsLimit, false);
    }
    if (!collapsePreferenceTouchedRef.current) {
      setCollapseRawOutput(nextSettings.config.collapseRawOutput, false);
    }
  }

  function stopTaskWatch() {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (pollingTimerRef.current !== null) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }

  async function refreshStatus() {
    setStatus(await readJson<AppStatus>("/api/status"));
  }

  async function refreshSettings(options?: { applyDefaults?: boolean }) {
    setSettingsError(null);
    const response = await readJson<SettingsResponse>("/api/settings");
    setSettings(response);
    syncSettingsToForm(response);
    if (options?.applyDefaults) {
      applySettingsDefaults(response);
      initializedFromSettingsRef.current = true;
    }
    return response;
  }

  async function refreshSkills(scope = skillsScope) {
    setSkillsError(null);
    try {
      setSkills(await readJson<SkillsListResponse>(`/api/skills/list?scope=${scope}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSkillsError(message);
      setSkills(null);
    }
  }

  async function refreshMcp(scope = mcpScope) {
    try {
      const [list, agents] = await Promise.all([
        readJson<CommandResult>(`/api/mcp/list?scope=${scope}`),
        readJson<CommandResult>("/api/mcp/list-agents"),
      ]);
      setMcpList(list);
      setMcpAgents(agents);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPageError(message);
    }
  }

  async function refreshLogs(limit = logsLimit) {
    setLogsBusy(true);
    setLogsError(null);
    try {
      const response = await readJson<LogsListResponse>(`/api/logs?limit=${limit}`);
      setLogs(response.logs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLogsError(message);
      setLogs([]);
    } finally {
      setLogsBusy(false);
    }
  }

  async function load() {
    setPageError(null);
    try {
      const nextSettings = await refreshSettings({ applyDefaults: true });
      const nextSkillsScope = skillsScopeTouchedRef.current ? skillsScope : nextSettings.config.defaultSkillsScope;
      const nextMcpScope = mcpScopeTouchedRef.current ? mcpScope : nextSettings.config.defaultMcpScope;
      const nextLogsLimit = logsLimitTouchedRef.current ? logsLimit : nextSettings.config.defaultLogsLimit;
      await Promise.all([
        refreshStatus(),
        refreshSkills(nextSkillsScope),
        refreshMcp(nextMcpScope),
        refreshLogs(nextLogsLimit),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPageError(message);
    }
  }

  async function fetchTask(taskId: string) {
    const response = await readJson<TaskGetResponse>(`/api/tasks/${taskId}`);
    return response.task;
  }

  function startPollingTask(taskId: string, title: string) {
    stopTaskWatch();
    pollingTimerRef.current = window.setInterval(() => {
      void fetchTask(taskId)
        .then((task) => {
          setActiveTask({ title, task, transport: "polling" });
          if (isTaskFinished(task)) {
            stopTaskWatch();
            void refreshStatus();
            void refreshLogs();
            if (title.startsWith("Skills")) void refreshSkills();
            if (title.startsWith("MCP")) void refreshMcp();
          }
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          setPageError(message);
        });
    }, 1200);
  }

  function watchTask(taskId: string, title: string) {
    stopTaskWatch();
    const eventSource = new EventSource(`/api/tasks/${taskId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as TaskStreamEvent;
      setActiveTask((current) => {
        if (data.type === "snapshot" || data.type === "status") {
          return { title, task: data.task, transport: "sse" };
        }

        if (data.type === "chunk") {
          const baseTask = current?.task?.id === taskId
            ? current.task
            : {
              id: taskId,
              source: title,
              status: "running",
              createdAt: new Date().toISOString(),
              output: [],
            } satisfies TaskRecord;
          return { title, task: mergeTaskChunk(baseTask, data.chunk), transport: "sse" };
        }

        return current;
      });
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (eventSourceRef.current === eventSource) {
        eventSourceRef.current = null;
      }
      startPollingTask(taskId, title);
    };
  }

  useEffect(() => {
    void load();
    return () => stopTaskWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initializedFromSettingsRef.current) return;
    void refreshSkills(skillsScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillsScope]);

  useEffect(() => {
    if (!initializedFromSettingsRef.current) return;
    void refreshMcp(mcpScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcpScope]);

  useEffect(() => {
    if (!initializedFromSettingsRef.current) return;
    void refreshLogs(logsLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsLimit]);

  async function runWrite<TPayload>(title: string, url: string, payload: TPayload, onDone?: () => Promise<void>) {
    setBusy(title);
    setLastResult(null);
    try {
      const response = await readJson<TaskStartResponse>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const task = await fetchTask(response.taskId);
      setActiveTask({ title, task, transport: "sse" });
      watchTask(response.taskId, title);

      if (isTaskFinished(task) && onDone) {
        await onDone();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastResult({ title, result: emptyResult, error: message });
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    if (!activeTask || !isTaskFinished(activeTask.task)) return;
    setLastResult({
      title: activeTask.title,
      result: activeTask.task.result ?? emptyResult,
      error: activeTask.task.error,
    });
  }, [activeTask]);

  useEffect(() => {
    if (!activeTask || !isTaskFinished(activeTask.task)) return;
    void refreshStatus();
    void refreshLogs();
    if (activeTask.title.startsWith("Skills")) {
      void refreshSkills();
    }
    if (activeTask.title.startsWith("MCP")) {
      void refreshMcp();
    }
    stopTaskWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTask?.task.status]);

  async function handleSkillInstall(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: InstallSkillPayload = {
      packageName: installPackageName.trim(),
      scope: skillsScope,
      agents: splitLines(installAgents),
      skillNames: splitLines(installSkills),
      copy: installCopy,
      all: installAll,
      yes: true,
    };

    if (!payload.packageName) return;
    if (!confirmWrite("确认安装 Skill？", [
      `包：${payload.packageName}`,
      `范围：${payload.scope}`,
      `Agents：${payload.agents.join(", ") || "默认"}`,
      `Skills：${payload.skillNames.join(", ") || "全部/CLI默认"}`,
      `选项：${[payload.copy ? "copy" : null, payload.all ? "all" : null].filter(Boolean).join(", ") || "无"}`,
    ])) return;

    await runWrite("Skills install", "/api/skills/install", payload);
  }

  async function handleSkillRemove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: RemoveSkillPayload = {
      scope: skillsScope,
      skillNames: splitLines(removeSkillNames),
      agents: splitLines(removeAgents),
      all: removeAll,
      yes: true,
    };

    if (!payload.skillNames.length && !payload.all) return;
    if (!confirmWrite("确认删除 Skill？", [
      `范围：${payload.scope}`,
      `Skills：${payload.skillNames.join(", ") || "未填写"}`,
      `Agents：${payload.agents.join(", ") || "默认"}`,
      `全部删除：${payload.all ? "是" : "否"}`,
    ])) return;

    await runWrite("Skills remove", "/api/skills/remove", payload);
  }

  async function handleSkillUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: UpdateSkillPayload = {
      scope: skillsScope,
      names: splitLines(updateSkillNames),
      yes: true,
    };

    if (!confirmWrite("确认更新 Skill？", [
      `范围：${payload.scope}`,
      `Skills：${payload.names.join(", ") || "全部"}`,
    ])) return;

    await runWrite("Skills update", "/api/skills/update", payload);
  }

  async function handleMcpAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: AddMcpPayload = {
      target: mcpTarget.trim(),
      scope: mcpScope,
      agents: splitLines(mcpAgentsField),
      name: mcpName.trim() || undefined,
      transport: mcpTransport || undefined,
      headers: splitLines(mcpHeaders),
      env: splitLines(mcpEnv),
      all: mcpAll,
      gitignore: mcpGitignore,
      yes: true,
    };

    if (!payload.target) return;
    if (!confirmWrite("确认添加 MCP Server？", [
      `Target：${payload.target}`,
      `范围：${payload.scope}`,
      `Name：${payload.name ?? "自动推断"}`,
      `Agents：${payload.agents.join(", ") || (payload.all ? "全部" : "默认")}`,
      `Transport：${payload.transport ?? "CLI 默认"}`,
      `Headers：${payload.headers.length}`,
      `Env：${payload.env.length}`,
    ])) return;

    await runWrite("MCP add", "/api/mcp/add", payload);
  }

  async function handleSettingsSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsBusy(true);
    setSettingsError(null);
    try {
      const response = await readJson<SettingsResponse>("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      setSettings(response);
      syncSettingsToForm(response);
      setCollapseRawOutput(response.config.collapseRawOutput);
      setLastResult({
        title: "Settings saved",
        result: {
          command: "server settings",
          args: ["PUT", "/api/settings"],
          exitCode: 0,
          stdout: JSON.stringify(response.config, null, 2),
          stderr: "",
          durationMs: 0,
        },
      });
      void refreshLogs();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSettingsError(message);
    } finally {
      setSettingsBusy(false);
    }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">SkillDock Frontend MVP</p>
          <h1>Skills / MCP 操作台</h1>
          <p className="lead">只调用受控 server API；CLI 命令由服务端固定控制，前端不执行 shell，也不提交任意路径。</p>
        </div>
        <button className="ghostButton" type="button" onClick={() => void load()} disabled={Boolean(busy) || settingsBusy || logsBusy}>
          刷新全部
        </button>
      </header>

      {pageError ? <section className="banner error">页面加载异常：{pageError}</section> : null}
      {busy ? <section className="banner info">提交中：{busy}</section> : null}

      <section className="grid twoCols">
        <article className="card">
          <div className="sectionHeader">
            <h2>CLI 状态</h2>
            <span className="meta">{status?.serverTime ? new Date(status.serverTime).toLocaleString() : "加载中"}</span>
          </div>
          {status ? status.cli.map((item) => (
            <div className="row" key={item.name}>
              <span>{item.name}</span>
              <strong className={item.available ? "ok" : "bad"}>{item.available ? item.version : item.error || "不可用"}</strong>
            </div>
          )) : <p>加载中...</p>}
        </article>

        <article className="card">
          <div className="sectionHeader">
            <h2>最近一次写操作</h2>
            <span className="meta">task id / status / output / result</span>
          </div>
          {activeTask ? <TaskPanel state={activeTask} collapseRawOutput={collapseRawOutput} /> : lastResult ? <ResultPanel state={lastResult} collapseRawOutput={collapseRawOutput} /> : <p className="muted">尚未执行写操作。</p>}
        </article>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <h2>Settings</h2>
            <p className="muted">仅编辑安全偏好；CLI 路径与命令标签只读展示。</p>
          </div>
          <button className="ghostButton" type="button" onClick={() => void refreshSettings()} disabled={settingsBusy || Boolean(busy)}>
            刷新 Settings
          </button>
        </div>

        {settingsError ? <p className="errorText">Settings 加载/保存失败：{settingsError}</p> : null}
        {settings ? (
          <div className="grid twoCols settingsGrid">
            <FormCard title="Safe preferences" description="默认范围、日志条数与原始输出折叠偏好。">
              <form onSubmit={(event) => void handleSettingsSave(event)}>
                <label>
                  <span>Default Skills scope</span>
                  <select
                    value={settingsForm.defaultSkillsScope ?? DEFAULT_SCOPE}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, defaultSkillsScope: event.target.value as Scope }))}
                  >
                    <option value="project">project</option>
                    <option value="global">global</option>
                  </select>
                </label>
                <label>
                  <span>Default MCP scope</span>
                  <select
                    value={settingsForm.defaultMcpScope ?? DEFAULT_SCOPE}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, defaultMcpScope: event.target.value as Scope }))}
                  >
                    <option value="project">project</option>
                    <option value="global">global</option>
                  </select>
                </label>
                <label>
                  <span>Default logs limit</span>
                  <select
                    value={String(settingsForm.defaultLogsLimit ?? DEFAULT_LOG_LIMIT)}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, defaultLogsLimit: Number(event.target.value) }))}
                  >
                    {logLimitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="checkboxLabel">
                  <input
                    type="checkbox"
                    checked={Boolean(settingsForm.collapseRawOutput)}
                    onChange={(event) => setSettingsForm((current) => ({ ...current, collapseRawOutput: event.target.checked }))}
                  />
                  默认折叠原始 stdout/stderr 详情
                </label>
                <button className="primaryButton" disabled={settingsBusy || Boolean(busy)}>保存安全设置</button>
              </form>
            </FormCard>

            <article className="formCard">
              <h3>Config metadata</h3>
              <p className="muted small">以下信息只读，由服务端提供并控制。</p>
              <div className="detailsGrid settingsMetaList">
                <section>
                  <h4>Config status</h4>
                  <p>{settings.metadata.configStatus}</p>
                </section>
                <section>
                  <h4>Config path</h4>
                  <p className="small breakAll">{settings.metadata.configPath}</p>
                </section>
                <section>
                  <h4>Log path</h4>
                  <p className="small breakAll">{settings.metadata.logPath}</p>
                </section>
                <section>
                  <h4>CLI labels</h4>
                  <p className="small">Skills: {settings.metadata.cliCommands.skills}</p>
                  <p className="small">Add MCP: {settings.metadata.cliCommands.addMcp}</p>
                </section>
              </div>
              <div className="banner info compactBanner">
                Web 端不会暴露可编辑 CLI 路径、可执行文件路径或任意 shell 输入。
              </div>
            </article>
          </div>
        ) : <p>加载中...</p>}
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <h2>Logs</h2>
            <p className="muted">查看受控 API 记录的命令历史，输出已由服务端脱敏。</p>
          </div>
          <div className="toolbar wrapToolbar">
            <label className="inlineControl">
              <span>Limit</span>
              <select value={String(logsLimit)} onChange={(event) => setLogsLimit(Number(event.target.value))}>
                {logLimitOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="checkboxLabel inlineCheckbox">
              <input type="checkbox" checked={collapseRawOutput} onChange={(event) => setCollapseRawOutput(event.target.checked)} />
              折叠原始详情
            </label>
            <button className="ghostButton" type="button" onClick={() => void refreshLogs()} disabled={logsBusy || Boolean(busy)}>
              {logsBusy ? "刷新中..." : "刷新 Logs"}
            </button>
          </div>
        </div>

        {logsError ? <p className="errorText">Logs 加载失败：{logsError}</p> : null}
        {!logsError && !logs.length ? <p className="muted">暂无日志记录。</p> : null}
        <div className="logList">
          {logs.map((log) => (
            <article className="logItem" key={log.id}>
              <div className="logHeader">
                <div>
                  <strong>{log.source}</strong>
                  <p className="muted small">{formatTime(log.timestamp)}</p>
                </div>
                <div className="metaGrid">
                  <span>exitCode: {log.result.exitCode}</span>
                  <span>durationMs: {log.result.durationMs}</span>
                </div>
              </div>
              <div className="logMetaGrid">
                <span><strong>command:</strong> {formatCommand(log.result)}</span>
                <span><strong>args:</strong> {log.result.args.join(" ") || "(none)"}</span>
              </div>
              <pre>{getLogPreview(log) || "(empty output)"}</pre>
              <details open={!collapseRawOutput}>
                <summary>展开 stdout / stderr 详情</summary>
                <div className="detailsGrid">
                  <section>
                    <h4>stdout</h4>
                    <pre>{log.result.stdout || "(empty)"}</pre>
                  </section>
                  <section>
                    <h4>stderr</h4>
                    <pre>{log.result.stderr || "(empty)"}</pre>
                  </section>
                </div>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="sectionHeader">
          <div>
            <h2>Skills</h2>
            <p className="muted">{skillCountLabel}</p>
          </div>
          <div className="toolbar">
            <ScopeToggle label="Skills 范围" value={skillsScope} onChange={setSkillsScope} />
            <button className="ghostButton" type="button" onClick={() => void refreshSkills()} disabled={Boolean(busy)}>
              刷新列表
            </button>
          </div>
        </div>

        {skillsError ? <p className="errorText">Skills 加载失败：{skillsError}</p> : null}
        <div className="skillsList">
          {skills?.skills.length ? skills.skills.map((skill) => (
            <div className="skillItem" key={`${skill.name}-${skill.path ?? skill.scope ?? "na"}`}>
              <div>
                <strong>{skill.name}</strong>
                <p className="muted small">{skill.path || skill.scope || "无路径信息"}</p>
              </div>
              <span className="tag">{skill.agents?.join(", ") || "all agents"}</span>
            </div>
          )) : <p className="muted">暂无数据。</p>}
        </div>

        <div className="grid threeCols formsGrid">
          <FormCard title="Install Skill" description="安装技能包；不直接传命令。">
            <form onSubmit={(event) => void handleSkillInstall(event)}>
              <label>
                <span>Package / Repo</span>
                <input value={installPackageName} onChange={(event) => setInstallPackageName(event.target.value)} placeholder="vercel-labs/agent-skills" />
              </label>
              <label>
                <span>Agents</span>
                <input value={installAgents} onChange={(event) => setInstallAgents(event.target.value)} placeholder="claude-code, cursor" />
              </label>
              <label>
                <span>Skills</span>
                <input value={installSkills} onChange={(event) => setInstallSkills(event.target.value)} placeholder="pr-review, commit" />
              </label>
              <div className="checkboxRow">
                <label><input type="checkbox" checked={installCopy} onChange={(event) => setInstallCopy(event.target.checked)} /> copy</label>
                <label><input type="checkbox" checked={installAll} onChange={(event) => setInstallAll(event.target.checked)} /> all</label>
              </div>
              <button className="primaryButton" disabled={Boolean(busy) || !installPackageName.trim()}>确认安装</button>
            </form>
          </FormCard>

          <FormCard title="Remove Skill" description="支持按名称删除，或 all 批量删除。">
            <form onSubmit={(event) => void handleSkillRemove(event)}>
              <label>
                <span>Skill names</span>
                <input value={removeSkillNames} onChange={(event) => setRemoveSkillNames(event.target.value)} placeholder="frontend-design, commit" />
              </label>
              <label>
                <span>Agents</span>
                <input value={removeAgents} onChange={(event) => setRemoveAgents(event.target.value)} placeholder="claude-code, cursor" />
              </label>
              <label className="checkboxLabel"><input type="checkbox" checked={removeAll} onChange={(event) => setRemoveAll(event.target.checked)} /> 删除全部匹配</label>
              <button className="primaryButton" disabled={Boolean(busy) || (!removeAll && !removeSkillNames.trim())}>确认删除</button>
            </form>
          </FormCard>

          <FormCard title="Update Skill" description="留空则更新当前范围全部 Skills。">
            <form onSubmit={(event) => void handleSkillUpdate(event)}>
              <label>
                <span>Skill names</span>
                <input value={updateSkillNames} onChange={(event) => setUpdateSkillNames(event.target.value)} placeholder="可选，逗号分隔" />
              </label>
              <button className="primaryButton" disabled={Boolean(busy)}>确认更新</button>
            </form>
          </FormCard>
        </div>
      </section>

      <section className="grid twoCols">
        <article className="card">
          <div className="sectionHeader">
            <div>
              <h2>MCP</h2>
              <p className="muted">新增服务器表单 + 当前 list 输出。</p>
            </div>
            <div className="toolbar">
              <ScopeToggle label="MCP 范围" value={mcpScope} onChange={setMcpScope} />
              <button className="ghostButton" type="button" onClick={() => void refreshMcp()} disabled={Boolean(busy)}>
                刷新 MCP
              </button>
            </div>
          </div>

          <FormCard title="Add MCP Server" description="MVP 直接展示 CLI 原始输出，不做复杂解析。">
            <form onSubmit={(event) => void handleMcpAdd(event)}>
              <label>
                <span>Target</span>
                <input value={mcpTarget} onChange={(event) => setMcpTarget(event.target.value)} placeholder="@modelcontextprotocol/server-filesystem 或 https://..." />
              </label>
              <label>
                <span>Name</span>
                <input value={mcpName} onChange={(event) => setMcpName(event.target.value)} placeholder="可选" />
              </label>
              <label>
                <span>Agents</span>
                <input value={mcpAgentsField} onChange={(event) => setMcpAgentsField(event.target.value)} placeholder="codex, cursor" />
              </label>
              <label>
                <span>Transport</span>
                <select value={mcpTransport} onChange={(event) => setMcpTransport(event.target.value as "" | "http" | "sse") }>
                  <option value="">CLI 默认</option>
                  <option value="http">http</option>
                  <option value="sse">sse</option>
                </select>
              </label>
              <label>
                <span>Headers</span>
                <textarea value={mcpHeaders} onChange={(event) => setMcpHeaders(event.target.value)} placeholder={"Authorization: Bearer xxx\nX-Team: demo"} rows={3} />
              </label>
              <label>
                <span>Env</span>
                <textarea value={mcpEnv} onChange={(event) => setMcpEnv(event.target.value)} placeholder={"API_KEY=xxx\nMODE=dev"} rows={3} />
              </label>
              <div className="checkboxRow stacked">
                <label><input type="checkbox" checked={mcpAll} onChange={(event) => setMcpAll(event.target.checked)} /> all agents</label>
                <label><input type="checkbox" checked={mcpGitignore} onChange={(event) => setMcpGitignore(event.target.checked)} /> gitignore generated files</label>
              </div>
              <button className="primaryButton" disabled={Boolean(busy) || !mcpTarget.trim()}>确认添加 MCP</button>
            </form>
          </FormCard>
        </article>

        <article className="card outputStack">
          <div>
            <h2>MCP List 输出</h2>
            <ResultPanel state={{ title: `MCP list (${mcpScope})`, result: mcpList ?? emptyResult }} compact collapseRawOutput={collapseRawOutput} />
          </div>
          <div>
            <h2>List Agents 输出</h2>
            <ResultPanel state={{ title: "MCP list-agents", result: mcpAgents ?? emptyResult }} compact collapseRawOutput={collapseRawOutput} />
          </div>
        </article>
      </section>
    </main>
  );
}

function ScopeToggle({ label, value, onChange }: { label: string; value: Scope; onChange: (scope: Scope) => void }) {
  return (
    <div className="toggleGroup" aria-label={label}>
      <button type="button" className={value === "project" ? "toggle active" : "toggle"} onClick={() => onChange("project")}>
        Project
      </button>
      <button type="button" className={value === "global" ? "toggle active" : "toggle"} onClick={() => onChange("global")}>
        Global
      </button>
    </div>
  );
}

function FormCard({ title, description, children }: React.PropsWithChildren<{ title: string; description: string }>) {
  return (
    <section className="formCard">
      <h3>{title}</h3>
      <p className="muted small">{description}</p>
      {children}
    </section>
  );
}

function TaskPanel({ state, collapseRawOutput }: { state: TaskViewState; collapseRawOutput: boolean }) {
  const { task, title, transport } = state;
  const output = task.output.length ? task.output : [{ timestamp: task.createdAt, stream: "system", text: "任务已创建，等待输出..." } satisfies TaskOutputChunk];

  return (
    <div className="taskPanel">
      <div className="taskSummary">
        <div>
          <strong>{title}</strong>
          <p className="muted small">source: {task.source}</p>
        </div>
        <span className={`taskBadge ${task.status}`}>{task.status}</span>
      </div>

      <div className="taskMetaGrid">
        <span>taskId: {task.id}</span>
        <span>stream: {transport}</span>
        <span>created: {formatTime(task.createdAt)}</span>
        <span>started: {formatTime(task.startedAt)}</span>
        <span>finished: {formatTime(task.finishedAt)}</span>
        <span>operationLogId: {task.operationLogId ?? "-"}</span>
      </div>

      <div className="taskStreams">
        <h3>输出流</h3>
        <pre>{output.map((chunk) => `[${new Date(chunk.timestamp).toLocaleTimeString()}] [${chunk.stream}] ${chunk.text}`).join("")}</pre>
      </div>

      {task.error ? <p className="errorText">错误：{task.error}</p> : null}
      {task.result ? <ResultPanel state={{ title: `${title} result`, result: task.result, error: task.error }} compact={false} collapseRawOutput={collapseRawOutput} /> : null}
    </div>
  );
}

function ResultPanel({ state, compact = false, collapseRawOutput }: { state: ResultState; compact?: boolean; collapseRawOutput: boolean }) {
  const { title, result, error } = state;
  const primaryOutput = error || result.stdout || result.stderr || `exit ${result.exitCode}`;

  return (
    <div className={compact ? "resultPanel compact" : "resultPanel"}>
      <div className="resultMeta">
        <strong>{title}</strong>
        <div className="metaGrid">
          <span>exitCode: {result.exitCode}</span>
          <span>durationMs: {result.durationMs}</span>
        </div>
      </div>
      <pre>{primaryOutput}</pre>
      {!compact ? (
        <details open={!collapseRawOutput}>
          <summary>展开 stderr / stdout</summary>
          <div className="detailsGrid">
            <section>
              <h4>stdout</h4>
              <pre>{result.stdout || "(empty)"}</pre>
            </section>
            <section>
              <h4>stderr</h4>
              <pre>{result.stderr || "(empty)"}</pre>
            </section>
          </div>
        </details>
      ) : null}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
