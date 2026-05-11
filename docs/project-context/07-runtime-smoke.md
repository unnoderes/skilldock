# 07. Runtime Smoke Checklist

本清单用于验证 Project Context 的运行时闭环。执行前先阅读
[Runtime Smoke Test Guide](../11-runtime-smoke.md)，并确保 SkillDock server 已启动。

## 安全边界

- 只通过 `POST /api/projects` 注册本地路径。
- Skills / MCP API 只传 `projectId`，不传 raw path。
- 不使用真实 token / key / secret / password。
- 不把本机临时路径、`~/.skilldock/**`、smoke 输出或日志提交到仓库。
- opt-in 写操作会调用真实 CLI，默认使用可安全失败的测试输入。

## 准备临时项目

使用测试者本机临时目录，不在文档或代码中固定任何本地路径：

```bash
SMOKE_PROJECT_A="$(mktemp -d)"
SMOKE_PROJECT_B="$(mktemp -d)"
SMOKE_FILE="$(mktemp)"
SMOKE_MISSING="$SMOKE_PROJECT_A-missing"
```

这些路径只用于 `POST /api/projects`。后续 Skills / MCP 请求必须使用 API 返回的
`projectId`。

## Checklist

### 1. 查看项目 registry

```bash
curl http://127.0.0.1:3301/api/projects
```

预期：

- HTTP 200。
- 返回 `projects`、`activeProjectId`、`launchProjectId`。
- `launchProjectId` 对应的项目存在，且 `isLaunchProject: true`。
- 每个项目包含 `id`、`name`、`path`、`status`、`addedAt`、`lastUsedAt`、`lastValidatedAt`。

### 2. 添加有效项目路径

```bash
curl -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d "{\"path\":\"$SMOKE_PROJECT_A\",\"makeActive\":true}"
```

预期：

- HTTP 200。
- 新项目出现在 `projects` 中。
- 新项目 `status` 为 `valid`。
- `activeProjectId` 等于新项目 `id`。
- 保存的 `path` 是 server 规范化后的 canonical path。

建议从响应中记录：

```txt
PROJECT_A_ID=<response.projects 中 path 对应 SMOKE_PROJECT_A 的 id>
```

### 3. 添加无效项目路径

相对路径：

```bash
curl -i -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"path":"relative/project","makeActive":true}'
```

不存在的绝对路径：

```bash
curl -i -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d "{\"path\":\"$SMOKE_MISSING\",\"makeActive\":true}"
```

文件路径：

```bash
curl -i -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d "{\"path\":\"$SMOKE_FILE\",\"makeActive\":true}"
```

预期：

- 返回 400。
- error 分别类似 `INVALID_PROJECT_PATH`、`PROJECT_NOT_FOUND`、`PROJECT_NOT_DIRECTORY`。
- 不执行任何 Skills / MCP CLI。
- 不改变 active project。

### 4. 切换 active project

先添加第二个有效项目：

```bash
curl -X POST http://127.0.0.1:3301/api/projects \
  -H 'Content-Type: application/json' \
  -d "{\"path\":\"$SMOKE_PROJECT_B\",\"makeActive\":false}"
```

记录 `PROJECT_B_ID` 后切换：

```bash
curl -X PUT http://127.0.0.1:3301/api/projects/active \
  -H 'Content-Type: application/json' \
  -d "{\"projectId\":\"$PROJECT_B_ID\"}"
```

预期：

- HTTP 200。
- `activeProjectId` 等于 `PROJECT_B_ID`。
- 对应项目 `lastUsedAt` 更新。
- 如果传不存在的 `projectId`，返回 `PROJECT_NOT_FOUND`。

### 5. Skills Project scope 查询

```bash
curl "http://127.0.0.1:3301/api/skills/list?scope=project&projectId=$PROJECT_B_ID"
```

预期：

- HTTP 200，或 CLI 不可用时返回受控错误结果。
- 返回 JSON 包含 `result` 和 `skills`。
- `result.command` 为 `npx`，`result.args` 是固定白名单参数，不包含 raw project path。
- server 使用 `PROJECT_B_ID` 解析出的 cwd 执行 project-scope 查询。

### 6. MCP Project scope 查询

```bash
curl "http://127.0.0.1:3301/api/mcp/list?scope=project&projectId=$PROJECT_B_ID"
```

预期：

- HTTP 200，或 CLI 不可用时返回受控错误结果。
- 返回 `CommandResult`。
- `result.args` 是固定白名单参数，不包含 raw project path。
- `add-mcp list` 仍以原始 stdout / stderr 为准，不做复杂解析。

### 7. Opt-in 写操作检查

> 警告：以下步骤会调用真实 CLI。默认使用明显不存在的 package，验证 task / logs /
> project metadata 链路即可，不要求安装成功。

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

- 返回 `{ "taskId": "<uuid>" }`。
- task 最终可失败，但必须能通过 task API 查询。
- 输出和日志中不出现真实敏感值。

### 8. Task project metadata

```bash
curl "http://127.0.0.1:3301/api/tasks/<taskId>"
```

预期：

- `task.project.projectId` 等于写操作提交时的 `PROJECT_B_ID`。
- `task.project.projectName` 和 `task.project.projectPath` 来自 registry。
- `task.scope` 等于提交时的 scope。
- 切换 active project 后再查同一 task，task project metadata 不变。

### 9. Logs project metadata

```bash
curl "http://127.0.0.1:3301/api/logs?limit=10"
```

预期：

- 对应 operation log 包含 `project` 和 `scope`。
- `project.projectId` 等于写操作提交时的 `PROJECT_B_ID`。
- `result.args` 不包含 raw project path。
- token / key / secret / password 等假敏感值被替换为 `[REDACTED]`。

### 10. Invalid project 行为

让已注册的临时目录失效：

```bash
rmdir "$SMOKE_PROJECT_B"
```

重新查询 registry：

```bash
curl http://127.0.0.1:3301/api/projects
```

预期：

- 对应项目状态变为 `missing`、`not-directory` 或 `inaccessible`。
- 若 active project 失效，server fallback 到 launch project。

继续访问失效项目：

```bash
curl -i "http://127.0.0.1:3301/api/skills/list?scope=project&projectId=$PROJECT_B_ID"
```

预期：

- 返回结构化错误，通常为 `PROJECT_INVALID`。
- project-scope 写操作同样被阻止。
- 前端应展示 invalid 状态并禁用 project-scope 写按钮。

### 11. 删除 recent project 不删除磁盘目录

删除仍然存在的非 launch project：

```bash
curl -X DELETE "http://127.0.0.1:3301/api/projects/$PROJECT_A_ID"
```

预期：

- HTTP 200。
- `PROJECT_A_ID` 不再出现在 `projects` 中。
- `test -d "$SMOKE_PROJECT_A"` 仍成功。
- 不删除任何 Skills / MCP 配置。
- 删除 launch project 应返回 `INVALID_REQUEST`。

## Known Caveats

- `GET /api/projects` 会 revalidate registry，项目状态可能因磁盘变化而更新。
- `activeProjectId` 缺失、指向不存在项目或指向 invalid project 时，会 fallback 到 launch project。
- task 只保存在当前 server 进程内，server 重启后旧 `taskId` 可能无法查询。
- operation logs 会保留已完成任务的 project metadata，但不要把日志文件提交到仓库。
- Global scope 仍通过固定业务 API 执行，并显式使用 `--global`；它不是 raw path 或 raw shell 入口。
- 删除 recent project 只修改 SkillDock registry，不删除磁盘目录。

## 清理

```bash
test -d "$SMOKE_PROJECT_A" && rmdir "$SMOKE_PROJECT_A"
test -d "$SMOKE_PROJECT_B" && rmdir "$SMOKE_PROJECT_B"
test -f "$SMOKE_FILE" && rm "$SMOKE_FILE"
```

如果执行了真实成功的 Skills / MCP 写操作，还需要使用对应 CLI 或 UI 能力清理测试对象。
