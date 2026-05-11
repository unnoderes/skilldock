# 11. Runtime Smoke Test Guide

## 目的

这份指南用于重复验证 SkillDock MVP 的运行时闭环是否正常：

1. 查看 server / CLI 状态
2. 查看 Skills / MCP 只读信息
3. 触发 opt-in 写操作并拿到 `taskId`
4. 查看 task 状态、输出流、最终结果
5. 查看 operation logs
6. 检查脱敏是否生效

本文档仅覆盖当前 `origin/main` 已存在能力，不新增产品功能，不要求执行破坏性操作。

## 前置条件

执行 smoke test 前，请确认：

- Node.js 与 `pnpm` 已安装且可用
- 已在仓库根目录执行 `pnpm install`
- 本机可通过 `npx` 调用：
  - `npx skills`
  - `npx add-mcp`
- 当前基线已包含：
  - LogPersistence-06：`GET /api/logs` 与 `~/.skilldock/logs/operations.jsonl`
  - TaskStream-07：写操作返回 `{ taskId }`，支持 `GET /api/tasks/:id` 与 `GET /api/tasks/:id/stream`
- 不要在示例里填入真实 token / key / secret / password

建议先做一次静态验证：

```bash
pnpm typecheck
pnpm build
```

## 启动方式

在仓库根目录执行：

```bash
pnpm dev
```

默认地址：

- Web URL：`http://127.0.0.1:5173`
- Server URL：`http://127.0.0.1:3301`

可先确认进程已起来：

```bash
curl http://127.0.0.1:3301/healthz
```

预期返回：

```json
{"ok":true}
```

## Smoke Test 结构

建议按以下顺序执行：

1. Read-only checks（不修改本地配置）
2. TaskStream checks（基于已触发的写操作验证 task API / SSE）
3. Opt-in write checks（仅在你明确接受会调用真实 CLI 时执行）
4. Web UI checks
5. Log redaction checks
6. Project Context checks（多项目注册、切换、CLI cwd 隔离）
7. Cleanup checks

---

## 1) Read-only Smoke Checks

这些检查不应修改本地 Skills / MCP 配置。

### 1.1 `GET /healthz`

```bash
curl http://127.0.0.1:3301/healthz
```

预期：

- HTTP 200
- body 含 `{"ok":true}`

### 1.2 `GET /api/status`

```bash
curl http://127.0.0.1:3301/api/status
```

预期：

- HTTP 200
- 返回字段包含：
  - `name`
  - `ok`
  - `serverTime`
  - `cli`
- `cli` 中应至少有：
  - `skills`
  - `add-mcp`
- 若本机 CLI 可用，条目应显示：
  - `available: true`
  - `version: <版本输出>`
- 若 CLI 不可用，也应返回结构化结果，而不是任意 shell 执行入口

### 1.3 `GET /api/skills/list?scope=project`

```bash
curl "http://127.0.0.1:3301/api/skills/list?scope=project"
```

预期：

- HTTP 200
- 返回 JSON 包含：
  - `result`
  - `skills`
- `result` 是受控 CLI 调用结果，包含：
  - `command`
  - `args`
  - `exitCode`
  - `stdout`
  - `stderr`
  - `durationMs`
- `skills` 为数组；为空也可接受

### 1.4 `GET /api/skills/list?scope=global`

```bash
curl "http://127.0.0.1:3301/api/skills/list?scope=global"
```

预期同上；差异仅为 CLI 参数包含 `--global`。

### 1.5 `GET /api/mcp/list?scope=project`

```bash
curl "http://127.0.0.1:3301/api/mcp/list?scope=project"
```

预期：

- HTTP 200
- 返回 `CommandResult`
- 因 `add-mcp list` 目前无 JSON 输出，MVP 只校验原始 stdout / stderr 是否合理返回

### 1.6 `GET /api/mcp/list?scope=global`

```bash
curl "http://127.0.0.1:3301/api/mcp/list?scope=global"
```

预期同上；差异仅为 CLI 参数包含 `--global`。

### 1.7 `GET /api/mcp/list-agents`

```bash
curl http://127.0.0.1:3301/api/mcp/list-agents
```

预期：

- HTTP 200
- 返回 `CommandResult`
- stdout 或 stderr 应包含真实 CLI 输出，不做复杂解析

### 1.8 `GET /api/logs?limit=5`

```bash
curl "http://127.0.0.1:3301/api/logs?limit=5"
```

预期：

- HTTP 200
- 返回：
  - `logs: OperationLogEntry[]`
- 每条 log 应包含：
  - `id`
  - `timestamp`
  - `source`
  - `result`
- 首次启动、尚未执行任何 API 时，`logs` 为空数组也属于合理结果

### 1.9 `GET /api/settings`

```bash
curl http://127.0.0.1:3301/api/settings
```

预期：

- HTTP 200
- 返回 JSON 包含：
  - `config`
  - `metadata`
- `config` 仅包含安全偏好字段：
  - `defaultSkillsScope`
  - `defaultMcpScope`
  - `defaultLogsLimit`
  - `collapseRawOutput`
- `metadata` 仅用于只读展示，不提供可编辑 CLI 路径或任意命令入口

---

## 2) TaskStream Smoke Checks

TaskStream 只针对写操作生效。当前写操作 API：

- `POST /api/skills/install`
- `POST /api/skills/remove`
- `POST /api/skills/update`
- `POST /api/mcp/add`

### 2.1 写操作返回 `{ taskId }`

任意写操作提交后，预期 HTTP body 形如：

```json
{"taskId":"<uuid>"}
```

说明：

- server 会立即返回 task id
- CLI 在后台异步运行
- 前端优先通过 SSE 订阅输出，断开后回退 polling

### 2.2 `GET /api/tasks/:id`

示例：

```bash
curl "http://127.0.0.1:3301/api/tasks/<taskId>"
```

预期返回字段：

- `task.id`
- `task.source`
- `task.status`：`queued` / `running` / `succeeded` / `failed`
- `task.createdAt`
- `task.startedAt`（开始后出现）
- `task.finishedAt`（结束后出现）
- `task.output`：输出流片段数组
- `task.result`：最终 `CommandResult`（结束后出现）
- `task.error`：失败时可出现
- `task.operationLogId`：任务完成并成功写入 operation log 后出现

### 2.3 `GET /api/tasks/:id/stream`

示例：

```bash
curl -N "http://127.0.0.1:3301/api/tasks/<taskId>/stream"
```

这是 SSE 接口。预期事件类型：

- `snapshot`
  - 连接建立后先返回 task 快照
- `chunk`
  - CLI 运行中不断追加输出片段
- `status`
  - task 状态变更时返回最新 task

说明：

- 当前 SSE 以 `data: <json>` 形式返回，不单独设置 event name
- server 每 15 秒发送 keep-alive 注释
- 浏览器端 SSE 断开时，web 会回退到短轮询 `GET /api/tasks/:id`

---

## 3) Opt-in 写操作 Checks

> 警告：以下步骤会调用真实 CLI，并可能修改本地 Skills / MCP 配置。默认不要随便执行。

安全建议：

- 优先使用测试 skill / 测试 agent / 测试 MCP target
- 不要填真实生产 token
- 不要依赖真实安装成功才算通过 smoke
- 优先选择“可安全失败”的用例，验证 task、stream、logs、redaction 即可

### 3.1 推荐：使用明显不存在的 package 触发 failed task

这样可以验证完整写链路，同时避免真的安装成功。

示例：

```bash
curl -X POST http://127.0.0.1:3301/api/skills/install \
  -H 'Content-Type: application/json' \
  -d '{
    "packageName": "definitely-not-a-real-skilldock-package-xyz",
    "scope": "project",
    "agents": [],
    "skillNames": [],
    "copy": false,
    "all": false,
    "fullDepth": false
  }'
```

预期：

- 返回 `{ taskId }`
- `GET /api/tasks/:id` 最终可见：
  - `status: "failed"` 或少数环境下其他明确失败表现
  - `result.exitCode != 0`
  - `error` 有值
- `GET /api/logs?limit=5` 可看到对应 operation entry

### 3.2 推荐：使用假值验证 MCP add 的脱敏与失败路径

> 警告：这会调用真实 `npx add-mcp`。

示例：

```bash
curl -X POST http://127.0.0.1:3301/api/mcp/add \
  -H 'Content-Type: application/json' \
  -d '{
    "target": "https://example.invalid/mcp",
    "scope": "project",
    "agents": ["codex"],
    "name": "runtime-smoke-test",
    "transport": "http",
    "headers": ["Authorization: Bearer sk-test-REDACTED-EXAMPLE"],
    "env": ["API_KEY=fake-test-key"],
    "all": false,
    "gitignore": true
  }'
```

预期：

- 返回 `{ taskId }`
- task 进入 `running`，随后 `succeeded` 或 `failed`
- 无论成功或失败，输出流、最终结果、operation logs 中的敏感值都应被替换为 `[REDACTED]`

### 3.3 若你必须验证成功路径

仅在你明确接受本地配置变更时执行，并确保使用可清理的测试对象：

- 测试 skill package
- 测试 MCP target
- 测试 agent name
- 测试专用 project 目录

验证完成后，请按 CLI 或 UI 当前 MVP 能力做清理，不要把真实安装结果留在工作环境里。

---

## 4) Web UI Checks

打开：`http://127.0.0.1:5173`

### 4.1 初始加载

预期页面能看到：

- CLI 状态卡片
- 最近一次写操作卡片
- Settings 卡片
- Logs 卡片
- Skills 列表与表单
- MCP 表单
- MCP list 输出
- list-agents 输出

### 4.2 刷新状态

点击“刷新全部”后，预期：

- `CLI 状态` 更新
- Skills 与 MCP 区域重新拉取数据
- 页面不暴露任意 shell 输入能力

### 4.3 切换 Skills / MCP scope

分别切换 `Project` / `Global`，预期：

- Skills 列表会重新请求 `/api/skills/list?scope=<scope>`
- MCP list 会重新请求 `/api/mcp/list?scope=<scope>`
- 页面仍只调用固定 server API

### 4.4 提交写操作后的 task 展示

提交任意 opt-in 写操作后，预期“最近一次写操作”卡片可见：

- `taskId`
- `status`
- `stream: sse`；若 SSE 断开则回退为 `polling`
- `created / started / finished`
- `operationLogId`
- 输出流内容
- 最终 `CommandResult`

### 4.5 SSE 断开后的回退

若浏览器或网络导致 SSE 断开，预期：

- UI 不应卡死
- task 卡片里的 `stream` 可切换为 `polling`
- 仍能轮询拿到任务最终状态

### 4.6 Settings 安全边界

预期：

- Settings 只允许修改默认 scope、日志条数、原始输出折叠偏好
- CLI 标签、config path、log path 为只读展示
- 页面不提供 CLI 路径、任意路径、任意命令的编辑入口

### 4.7 Logs 页面

预期：

- 可查看最近 operation logs
- 可调整 `limit`
- 每条日志展示 `command`、`args`、`exitCode`、`durationMs`、stdout/stderr
- 原始详情默认是否折叠，受当前页面偏好 / settings 控制

---

## 5) Log Redaction Checks

所有 redaction 检查都必须使用假值，不使用真实密钥。

可用示例：

- `Authorization: Bearer sk-test-REDACTED-EXAMPLE`
- `API_KEY=fake-test-key`
- `PASSWORD=fake-password`

检查位置：

1. task 输出流：`stdout` / `stderr` / `system`
2. task 最终结果：`args` / `stdout` / `stderr`
3. `GET /api/logs` 返回的 operation logs

预期：

- 命中脱敏规则的内容显示为 `[REDACTED]`
- 不应把原始 token / key / secret / password 写进：
  - 浏览器输出
  - server JSON 响应
  - `~/.skilldock/logs/operations.jsonl`

如果你故意传入如下假值：

- `Authorization: Bearer sk-test-REDACTED-EXAMPLE`
- `API_KEY=fake-test-key`

那么最终可接受的结果是日志中只出现类似：

- `Authorization: Bearer [REDACTED]`
- `API_KEY=[REDACTED]`
- 或直接 `[REDACTED]`

---

## 6) Project Context Checks

Project Context smoke 用于验证多项目 registry、active project、project-scope CLI cwd、
task metadata 和 operation logs metadata 是否形成同一个闭环。完整清单见：

- [Project Context Runtime Smoke Checklist](project-context/07-runtime-smoke.md)

### 6.1 `GET /api/projects`

```bash
curl http://127.0.0.1:3301/api/projects
```

预期：

- HTTP 200
- 返回：
  - `projects`
  - `activeProjectId`
  - `launchProjectId`
- `launchProjectId` 对应的项目必须存在，且 `isLaunchProject: true`
- 项目记录包含：
  - `id`
  - `name`
  - `path`
  - `status`
  - `isLaunchProject`
  - `addedAt`
  - `lastUsedAt`
  - `lastValidatedAt`

### 6.2 添加有效项目路径

不要在文档或脚本里固定本机路径。建议使用临时目录：

```bash
SMOKE_PROJECT_A="$(mktemp -d)"

curl -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d "{\"path\":\"$SMOKE_PROJECT_A\",\"makeActive\":true}"
```

预期：

- HTTP 200
- 新项目出现在 `projects` 中
- 新项目 `status` 为 `valid`
- 默认 `activeProjectId` 变为新项目 `id`
- server 保存 canonical path

记录响应中的项目 id，后续只使用 `projectId`：

```txt
PROJECT_A_ID=<response.projects 中临时目录对应的 id>
```

### 6.3 添加无效项目路径

相对路径：

```bash
curl -i -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"path":"relative/project","makeActive":true}'
```

不存在的绝对路径：

```bash
SMOKE_MISSING="$SMOKE_PROJECT_A-missing"

curl -i -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d "{\"path\":\"$SMOKE_MISSING\",\"makeActive\":true}"
```

文件路径：

```bash
SMOKE_FILE="$(mktemp)"

curl -i -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d "{\"path\":\"$SMOKE_FILE\",\"makeActive\":true}"
```

预期：

- HTTP 400
- error 分别类似：
  - `INVALID_PROJECT_PATH`
  - `PROJECT_NOT_FOUND`
  - `PROJECT_NOT_DIRECTORY`
- 不触发任何 Skills / MCP CLI
- 不改变 active project

### 6.4 切换 active project

```bash
SMOKE_PROJECT_B="$(mktemp -d)"

curl -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d "{\"path\":\"$SMOKE_PROJECT_B\",\"makeActive\":false}"
```

记录响应中的 `PROJECT_B_ID` 后切换：

```bash
curl -X PUT http://127.0.0.1:3301/api/projects/active \
  -H 'Content-Type: application/json' \
  -d "{\"projectId\":\"$PROJECT_B_ID\"}"
```

预期：

- HTTP 200
- `activeProjectId` 等于 `PROJECT_B_ID`
- 对应项目 `lastUsedAt` 更新
- 不存在的 `projectId` 返回 `PROJECT_NOT_FOUND`

### 6.5 Skills Project scope 查询

```bash
curl "http://127.0.0.1:3301/api/skills/list?scope=project&projectId=$PROJECT_B_ID"
```

预期：

- HTTP 200，或 CLI 不可用时返回合理的结构化错误结果
- 返回 JSON 包含 `result` 和 `skills`
- `result.args` 只包含固定 Skills CLI 参数，不包含 raw project path
- server 通过 `projectId` 解析 cwd，前端和调用方不传 raw path

### 6.6 MCP Project scope 查询

```bash
curl "http://127.0.0.1:3301/api/mcp/list?scope=project&projectId=$PROJECT_B_ID"
```

预期：

- HTTP 200，或 CLI 不可用时返回合理的结构化错误结果
- 返回 `CommandResult`
- `result.args` 只包含固定 MCP CLI 参数，不包含 raw project path
- `add-mcp list` 仍以原始 stdout / stderr 为准，不做复杂解析

### 6.7 Project scope opt-in 写操作

> 警告：这会调用真实 CLI。默认使用明显不存在的 package 验证 failed task，
> 不要求真实安装成功。

```bash
curl -X POST http://127.0.0.1:3301/api/skills/install \
  -H 'Content-Type: application/json' \
  -d "{
    \"packageName\":\"definitely-not-a-real-skilldock-package-xyz\",
    \"scope\":\"project\",
    \"projectId\":\"$PROJECT_B_ID\",
    \"agents\":[],
    \"skillNames\":[],
    \"copy\":false,
    \"all\":false,
    \"fullDepth\":false
  }"
```

预期：

- 返回 `{ taskId }`
- task 可通过 `GET /api/tasks/:id` 查询
- task 最终 `failed` 是可接受结果
- task 和 logs 中记录提交时的 `project` 和 `scope`
- 不出现未脱敏的 token / key / secret / password

### 6.8 Task project metadata 检查

```bash
curl "http://127.0.0.1:3301/api/tasks/<taskId>"
```

预期：

- `task.project.projectId` 等于写操作提交时的 `PROJECT_B_ID`
- `task.project.projectName` 和 `task.project.projectPath` 来自 registry
- `task.scope` 等于提交时的 scope
- task 创建后切换 active project，不改变该 task 的 project metadata

### 6.9 Logs project metadata 检查

```bash
curl "http://127.0.0.1:3301/api/logs?limit=10"
```

预期：

- 对应 operation log 包含 `project` 和 `scope`
- `project.projectId` 等于写操作提交时的 `PROJECT_B_ID`
- `result.args` 不包含 raw project path
- 敏感值被替换为 `[REDACTED]`

### 6.10 invalid project 行为

让已注册临时目录失效：

```bash
rmdir "$SMOKE_PROJECT_B"
curl http://127.0.0.1:3301/api/projects
```

预期：

- 对应项目状态变为 `missing`、`not-directory` 或 `inaccessible`
- 如果 active project 失效，server fallback 到 launch project
- 针对失效 `projectId` 的 project-scope 查询 / 写操作返回结构化错误，通常为 `PROJECT_INVALID`
- 前端展示 invalid 状态，并禁用 project-scope 写操作

### 6.11 删除 recent project 不删除磁盘目录

```bash
curl -X DELETE "http://127.0.0.1:3301/api/projects/$PROJECT_A_ID"
```

预期：

- HTTP 200
- `PROJECT_A_ID` 不再出现在 `projects` 中
- `test -d "$SMOKE_PROJECT_A"` 仍成功
- 不删除任何磁盘目录、Skills 配置或 MCP 配置
- 删除 launch project 返回 `INVALID_REQUEST`

---

## 7) 期望结果

完成 smoke 后，理想结果为：

- `pnpm typecheck` 通过
- `pnpm build` 通过
- 只读 API 返回 200，或在 CLI 缺失时返回合理的结构化错误结果
- 任一写操作都能返回 `{ taskId }`
- `GET /api/tasks/:id` 可查询到 `queued/running/succeeded/failed`
- `GET /api/tasks/:id/stream` 可返回 `snapshot` / `chunk` / `status`
- `GET /api/logs?limit=5` 可看到 operation entry
- `GET /api/projects` 可看到 launch project、active project 和 recent projects
- Skills / MCP project-scope API 只接收 `projectId`，不接收 raw path
- task 和 operation logs 可看到写操作发生时冻结的 project metadata
- 敏感信息被脱敏为 `[REDACTED]`

---

## 8) 故障排查

### 8.1 CLI 不可用

现象：

- `/api/status` 中 `skills` 或 `add-mcp` 显示 `available: false`
- list / write 操作报错

排查：

- 手工运行 `npx skills --version`
- 手工运行 `npx add-mcp --version`
- 确认本机网络、npm registry、npx 缓存正常

### 8.2 npx 下载慢或失败

现象：

- 命令首次执行耗时长
- task 长时间停留在 `running`
- stderr 出现 registry / network 失败

排查：

- 重试只读命令
- 检查 npm registry 设置
- 检查代理 / 网络环境

### 8.3 端口占用

现象：

- `pnpm dev` 启动失败
- 5173 或 3301 被其他进程占用

排查：

- 释放占用端口后重试
- 确认 web / server 指向的是同一组实例

### 8.4 SSE 连接断开

现象：

- 实时输出停止
- 浏览器 network 中 EventSource 断开

预期与排查：

- web 会自动回退 polling
- 可继续用 `GET /api/tasks/:id` 验证最终状态
- 若最终状态正常，则说明降级链路可用

### 8.5 server 重启后 task 查不到

这是当前 MVP 已知限制，不一定是 bug：

- task active state 仅保存在 server 当前进程内
- server 重启后，旧 `taskId` 可能返回 404
- 但已落盘的 operation logs 仍应保留在 `~/.skilldock/logs/operations.jsonl`

### 8.6 project path 变为 invalid

现象：

- `/api/projects` 中项目状态变为 `missing`、`not-directory` 或 `inaccessible`
- project-scope Skills / MCP 查询或写操作返回 `PROJECT_INVALID`

预期与排查：

- 这是 Project Context 的安全行为，不应绕过 registry 直接传 path
- 确认目录是否被删除、权限是否变化、路径是否从目录变为文件
- 如不再需要该项目，可从 recent projects 删除；这不会删除磁盘目录

---

## 9) 清理说明

- 不要提交 `~/.skilldock/logs/**`
- 不要提交 `~/.skilldock/projects.json`
- 不要提交任何本地 `.env`、token、key、secret、password
- 不要把 smoke 输出散落到仓库根目录
- 不要把本机临时 project path 写成固定测试数据提交

如果你执行了真实安装 / 添加操作，请在验证后清理：

- Skills：通过当前 CLI 或 UI 的 remove 能力删除测试对象
- MCP：通过当前 CLI 能力移除测试 server / 测试配置
- 若只执行了“故意失败”的测试样例，通常无需额外清理配置，但仍建议检查最近 logs
- Project Context：通过 `DELETE /api/projects/:id` 删除 recent project 记录；这不会删除磁盘目录
- 临时目录：用 `rmdir "$SMOKE_PROJECT_A"` / `rmdir "$SMOKE_PROJECT_B"` 清理本机测试目录

---

## 10) 最小执行清单

如只做最小闭环验证，可按下面顺序：

```bash
pnpm typecheck
pnpm build
pnpm dev
curl http://127.0.0.1:3301/healthz
curl http://127.0.0.1:3301/api/status
curl "http://127.0.0.1:3301/api/logs?limit=5"
```

如要继续验证 TaskStream：

1. 执行一个明确 opt-in 的写操作
2. 记录返回的 `taskId`
3. 查询 `/api/tasks/:id`
4. 订阅 `/api/tasks/:id/stream`
5. 再查 `/api/logs?limit=5`

如要继续验证 Project Context：

1. 查询 `/api/projects`
2. 用临时目录 `POST /api/projects`
3. 用返回的 `projectId` 查询 Skills / MCP project scope
4. 执行一个明确 opt-in 的 project-scope 写操作
5. 查询 task / logs 中的 project metadata
6. 删除 recent project 并确认磁盘目录仍存在

## 11) 当前 MVP 限制

- 不提供任意 shell 执行入口
- server 仅暴露固定业务 API
- `add-mcp` 相关输出当前以原始 CLI 文本为主，不做复杂解析
- task active state 仅在 server 当前进程内保存，不跨重启持久化
- 浏览器实时输出优先使用 SSE，断开后回退 polling
- 本文档不要求 destructive 写操作成功，只要求可验证 task / stream / logs / redaction 链路
- Project Context 只通过 registry 管理本地路径，Skills / MCP API 不接受 raw path
- `GET /api/projects` 会 revalidate recent projects，磁盘状态变化会反映为 invalid 状态
- 删除 recent project 只删除 registry 记录，不删除磁盘目录或 CLI 配置
