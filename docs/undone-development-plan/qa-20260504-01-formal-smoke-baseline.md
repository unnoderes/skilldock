# QA 2026-05-04 01 Formal Smoke Baseline

- Context Window: `SmokeMatrix-20260504-01`
- QA / PM Orchestrator: SkillDock QA / PM Orchestrator
- 日期：2026-05-04 CST
- 测试基线：`origin/main@740a4a19ea714e3519e44d963ae73d76073533fa`
- MVP tag：`v0.1.0-mvp` 存在；tag commit 为 `b0ca9cae3061c3f9dd244e7ddb1c664d50b3e99e`
- 工作目录：`/tmp/skilldock-qa-20260504`
- 分支：`docs/qa-formal-workflow-20260504`

## 当前阶段判断

正式进入 MVP 发布后功能测试流程。本轮为第一轮基线确认 + 静态验证 + read-only runtime smoke。

本地仓库 `/home/unnode/skilldock` 的 `main` 当前存在脏状态且与 `origin/main` 分叉：`ahead 2, behind 15`，不得作为测试基线。已创建干净 worktree `/tmp/skilldock-qa-20260504`，从 `origin/main` 派生测试文档分支。

## 基线确认

已执行：

```bash
git fetch --prune origin --tags
git status --short --branch
git branch -a --sort=-committerdate
git log --oneline --decorate -n 10 origin/main
git tag --sort=-creatordate | sed -n '1,20p'
```

结果摘要：

- `origin/main` 最新提交：`740a4a1 Merge pull request #11 from unnoderes/docs/mvp-final-sync`
- `v0.1.0-mvp` tag 存在，release baseline：`b0ca9ca`
- `origin/main` 在 `v0.1.0-mvp` 之后包含文档同步合入
- 本地根目录 `main` 有未提交/未跟踪改动，不用于测试

## 测试范围与验收标准

| 编号 | 范围 | 测试方式 | 验收标准 | 当前结果 |
|---|---|---|---|---|
| QA-SM-001 | origin/main 基线 | git refs/status/tag | 仅使用最新 `origin/main`，不使用脏 main | Pass |
| QA-SM-002 | Release tag 可追溯性 | `git show v0.1.0-mvp` | tag 存在且指向 MVP release baseline | Pass |
| QA-SM-003 | 依赖安装 | `pnpm install` | lockfile 一致，依赖可安装 | Pass |
| QA-SM-004 | TypeScript strict | `pnpm typecheck` | workspace typecheck 全通过 | Pass |
| QA-SM-005 | 构建链路 | `pnpm build` | server/shared/web build 全通过 | Pass |
| QA-SM-006 | Health | `GET /healthz` | HTTP 200，body `{ ok: true }` | Pass |
| QA-SM-007 | Overview / CLI status | `GET /api/status` | 返回 SkillDock 状态与 skills/add-mcp 可用性 | Pass |
| QA-SM-008 | Settings read-only 元数据 | `GET /api/settings` | 仅安全偏好可编辑，CLI/config/log path 为只读元数据 | Pass |
| QA-SM-009 | Operation logs | `GET /api/logs?limit=5` | 返回 `logs` 数组，结构符合 `OperationLogEntry[]` | Pass |
| QA-SM-010 | Skills project list | `GET /api/skills/list?scope=project` | HTTP 200，含 `result` 与 `skills[]` | Pass |
| QA-SM-011 | Skills global list | `GET /api/skills/list?scope=global` | HTTP 200，CLI args 含 `--global` | Pass |
| QA-SM-012 | MCP project list | `GET /api/mcp/list?scope=project` | HTTP 200，返回 raw `CommandResult` | Pass |
| QA-SM-013 | MCP global list | `GET /api/mcp/list?scope=global` | HTTP 200，CLI args 含 `--global` | Pass |
| QA-SM-014 | MCP list-agents | `GET /api/mcp/list-agents` | HTTP 200，返回 raw `CommandResult` | Pass |
| QA-SM-015 | Web dev root | `GET http://127.0.0.1:5173/` | Vite dev page 返回 HTML | Pass |
| QA-SM-016 | Web proxy API | `GET http://127.0.0.1:5173/api/status` | 通过 web proxy 访问 server API 成功 | Pass |
| QA-SM-017 | Redaction spot check | 检查 `/api/logs` 响应 | 不出现已知假 token/key 明文，出现 `[REDACTED]` | Pass |
| QA-SM-018 | 安全边界静态检查 | grep `execa` / shell hazard / routes | CLI 经固定 API，使用 `execa(command,args)`，未发现 shell 字符串拼接入口 | Pass |
| QA-SM-019 | 浏览器交互 UI | Chrome DevTools MCP | 可打开页面并检查表单/状态/日志交互 | Blocked：DevTools target closed |
| QA-SM-020 | TaskStream / SSE / write redaction | opt-in 写操作 | 返回 taskId，SSE/polling/log/redaction 闭环通过 | Not run：等待用户明确允许写操作 |

## 已执行命令与结果

```bash
pnpm install
# Pass；lockfile up to date；pnpm 提示 esbuild build scripts ignored（未阻塞本轮）

pnpm typecheck
# Pass；packages/shared、apps/server、apps/web 全部 Done

pnpm build
# Pass；packages/shared、apps/server、apps/web 全部 Done；Vite build 成功
```

Read-only runtime smoke：

```bash
curl http://127.0.0.1:3301/healthz
curl http://127.0.0.1:3301/api/status
curl http://127.0.0.1:3301/api/settings
curl "http://127.0.0.1:3301/api/logs?limit=5"
curl "http://127.0.0.1:3301/api/skills/list?scope=project"
curl "http://127.0.0.1:3301/api/skills/list?scope=global"
curl "http://127.0.0.1:3301/api/mcp/list?scope=project"
curl "http://127.0.0.1:3301/api/mcp/list?scope=global"
curl http://127.0.0.1:3301/api/mcp/list-agents
curl http://127.0.0.1:5173/
curl http://127.0.0.1:5173/api/status
```

结果：以上 API / Web root 均返回 HTTP 200。

CLI 状态：

- `skills`: available `true`, version `1.5.3`
- `add-mcp`: available `true`, version `1.8.0`

## 风险与边界

- 不执行破坏性写操作；本轮未执行 install/remove/update/add。
- 不使用真实 token/key/secret/password。
- 不提交 `.env`、`node_modules`、`dist`、本地配置或 smoke 输出。
- `~/.skilldock/logs/operations.jsonl` 只作为运行时验证对象，不纳入版本控制。
- 当前 `pnpm dev` server 端口 `3301` 已被 `/tmp/skilldock-v010-verify` 中的同树版本服务占用；本轮 read-only API 复用了该正在运行的同树服务。`git diff b3d4545..origin/main` 为空，代码/文档树等价；但后续完整回归建议先释放端口后用当前 worktree 独立启动。
- Chrome DevTools MCP 当前报错 `Target closed`，浏览器手工交互验证暂时阻塞；已通过 HTTP 验证 web root 与 Vite proxy。

## 已发现问题

当前未发现产品代码 bug。存在两个测试环境/流程阻塞项：

### QA-BLOCK-001：3301 端口被既有测试服务占用

- 严重程度：low（测试环境阻塞，不判定为产品 bug）
- 影响范围：无法在当前 worktree 独立完整启动 `pnpm dev` server
- 复现步骤：在 `/tmp/skilldock-qa-20260504` 执行 `pnpm dev`
- 期望结果：server 监听 `127.0.0.1:3301`
- 实际结果：`Error: listen EADDRINUSE: address already in use 127.0.0.1:3301`
- 相关进程：`/tmp/skilldock-v010-verify/apps/server` 正在监听 3301
- 建议处理：经用户确认后停止旧 dev server，或约定独立端口并同步调整 web proxy
- 禁止事项：不得擅自 kill 用户可能仍需要的进程
- 验收标准：当前 worktree 可独立启动 `pnpm dev`，health/status 仍通过

### QA-BLOCK-002：Chrome DevTools MCP target closed

- 严重程度：medium（阻塞 UI 手工交互验证）
- 影响范围：无法通过 DevTools MCP 检查 React 页面交互、按钮状态、SSE fallback UI
- 复现步骤：调用 Chrome DevTools MCP `list_pages` 或 `new_page http://127.0.0.1:5173`
- 期望结果：打开/列出页面并获取 a11y snapshot
- 实际结果：`Protocol error (Target.setDiscoverTargets): Target closed`
- 建议处理：重启/修复浏览器 MCP 环境后重跑 UI checklist
- 禁止事项：不得以 HTTP 200 替代完整 UI 交互结论
- 验收标准：可获取页面 snapshot，并完成 Overview/Skills/MCP/Logs/Settings 交互检查

## Bug Cards

本轮无产品 bug card。

## 下一张建议测试卡

Context Window: `TaskStreamRedaction-20260504-02`

目标：在用户明确 opt-in 后执行一条“可安全失败”的写操作，验证 task id、task status、SSE stream、polling fallback、operation logs 与 redaction。

建议优先用例：`POST /api/skills/install`，package 使用明显不存在的测试名，预期失败但不产生真实安装结果。

验收标准：

- 写 API 返回 `{ taskId }`
- `GET /api/tasks/:id` 返回 `queued/running/failed`，最终包含 `result.exitCode != 0`
- `GET /api/tasks/:id/stream` 返回 snapshot/chunk/status 或可观察到 polling fallback
- `GET /api/logs?limit=5` 出现对应 operation entry
- task/output/logs 中不出现任何假 token/key 明文

## 修复 Agent 触发提示

当前无产品修复任务，不生成修复 Agent 提示。若需要处理 QA-BLOCK-001，可使用以下环境清理提示：

```txt
Context Window: QAEnvPortReset-20260504
任务：释放 SkillDock QA 运行时 smoke 的 3301/5173 端口占用，确保 /tmp/skilldock-qa-20260504 可独立运行 pnpm dev。
允许范围：仅检查并停止明确属于旧 SkillDock dev smoke 的本地进程；不得删除文件；不得修改代码；不得停止非 SkillDock 进程。
验收：pnpm dev 在 /tmp/skilldock-qa-20260504 中启动后，/healthz 与 /api/status 返回 200。
禁止：不得 kill 不明来源进程；不得 force push；不得修改 main。
```

## 分支 / PR / release / tag 状态

- QA 文档分支：`docs/qa-formal-workflow-20260504`
- PR：尚未创建
- Release：`v0.1.0-mvp` 已存在
- 当前 release-ready 判断：read-only 与静态链路保持 release-ready；TaskStream/write redaction/UI 交互仍待下一轮验证
