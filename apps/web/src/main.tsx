import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { AppStatus, CommandResult, SkillRecord } from "@skilldock/shared";
import "./styles.css";

type SkillsResponse = { result: CommandResult; skills: SkillRecord[] };

function App() {
  const [status, setStatus] = useState<AppStatus | null>(null);
  const [skills, setSkills] = useState<SkillsResponse | null>(null);
  const [mcp, setMcp] = useState<CommandResult | null>(null);

  async function load() {
    const [statusRes, skillsRes, mcpRes] = await Promise.all([
      fetch("/api/status"),
      fetch("/api/skills/list?scope=global"),
      fetch("/api/mcp/list?scope=global"),
    ]);
    setStatus(await statusRes.json());
    setSkills(await skillsRes.json());
    setMcp(await mcpRes.json());
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="shell">
      <header>
        <p className="eyebrow">Local CLI Control Layer</p>
        <h1>SkillDock</h1>
        <p>`npx skills` 与 `npx add-mcp` 的本地图形化控制台。</p>
      </header>

      <section className="grid">
        <article className="card">
          <h2>CLI 状态</h2>
          {status ? status.cli.map((item) => (
            <div className="row" key={item.name}>
              <span>{item.name}</span>
              <strong className={item.available ? "ok" : "bad"}>{item.available ? item.version : "不可用"}</strong>
            </div>
          )) : <p>加载中...</p>}
        </article>

        <article className="card">
          <h2>全局 Skills</h2>
          <p>{skills ? `${skills.skills.length} 个` : "加载中..."}</p>
          <ul>
            {skills?.skills.slice(0, 8).map((skill) => <li key={`${skill.name}-${skill.path}`}>{skill.name}</li>)}
          </ul>
        </article>
      </section>

      <section className="card">
        <h2>MCP 列表输出</h2>
        <pre>{mcp ? (mcp.stdout || mcp.stderr || `exit ${mcp.exitCode}`) : "加载中..."}</pre>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
