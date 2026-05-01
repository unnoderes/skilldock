import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AppStatus, CommandResult, SkillRecord } from "@skilldock/shared";
import "./styles.css";

type Scope = "project" | "global";

type SkillsResponse = { result: CommandResult; skills: SkillRecord[] };
type ResultState = {
  title: string;
  result: CommandResult;
  error?: string;
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

function App() {
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [skillsScope, setSkillsScope] = useState<Scope>("project");
  const [skills, setSkills] = useState<SkillsResponse | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [mcpScope, setMcpScope] = useState<Scope>("project");
  const [mcpList, setMcpList] = useState<CommandResult | null>(null);
  const [mcpAgents, setMcpAgents] = useState<CommandResult | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ResultState | null>(null);

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

  const skillCountLabel = useMemo(() => {
    if (!skills) return "加载中...";
    return `${skills.skills.length} 个 ${skillsScope === "project" ? "项目" : "全局"} Skills`;
  }, [skills, skillsScope]);

  async function refreshStatus() {
    setStatus(await readJson<AppStatus>("/api/status"));
  }

  async function refreshSkills(scope = skillsScope) {
    setSkillsError(null);
    try {
      setSkills(await readJson<SkillsResponse>(`/api/skills/list?scope=${scope}`));
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

  async function load() {
    setPageError(null);
    try {
      await Promise.all([refreshStatus(), refreshSkills(skillsScope), refreshMcp(mcpScope)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPageError(message);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void refreshSkills(skillsScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillsScope]);

  useEffect(() => {
    void refreshMcp(mcpScope);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcpScope]);

  async function runWrite<TPayload>(title: string, url: string, payload: TPayload, onDone?: () => Promise<void>) {
    setBusy(title);
    try {
      const response = await readJson<unknown>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setLastResult({ title, result: normalizeResult(response) });
      if (onDone) await onDone();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastResult({ title, result: emptyResult, error: message });
    } finally {
      setBusy(null);
    }
  }

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

    await runWrite("Skills install", "/api/skills/install", payload, async () => {
      await refreshSkills();
      await refreshStatus();
    });
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

    await runWrite("Skills remove", "/api/skills/remove", payload, async () => {
      await refreshSkills();
      await refreshStatus();
    });
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

    await runWrite("Skills update", "/api/skills/update", payload, async () => {
      await refreshSkills();
      await refreshStatus();
    });
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

    await runWrite("MCP add", "/api/mcp/add", payload, async () => {
      await refreshMcp();
      await refreshStatus();
    });
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">SkillDock Frontend MVP</p>
          <h1>Skills / MCP 操作台</h1>
          <p className="lead">只调用受控 server API；写操作统一二次确认。</p>
        </div>
        <button className="ghostButton" type="button" onClick={() => void load()} disabled={Boolean(busy)}>
          刷新全部
        </button>
      </header>

      {pageError ? <section className="banner error">页面加载异常：{pageError}</section> : null}
      {busy ? <section className="banner info">执行中：{busy}</section> : null}

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
            <span className="meta">stdout / stderr / exitCode / durationMs</span>
          </div>
          {lastResult ? <ResultPanel state={lastResult} /> : <p className="muted">尚未执行写操作。</p>}
        </article>
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
            <ResultPanel state={{ title: `MCP list (${mcpScope})`, result: mcpList ?? emptyResult }} compact />
          </div>
          <div>
            <h2>List Agents 输出</h2>
            <ResultPanel state={{ title: "MCP list-agents", result: mcpAgents ?? emptyResult }} compact />
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

function ResultPanel({ state, compact = false }: { state: ResultState; compact?: boolean }) {
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
        <details>
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
