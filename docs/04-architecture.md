# 04. 技术架构

## 推荐技术栈

### 前端

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui

### 本地后端

- Node.js
- TypeScript
- Fastify
- execa
- pino

### 存储

MVP 阶段使用本地 JSON 文件：

```txt
~/.skilldock/
  config.json
  logs/
  cache/
  backups/
```

后续如需要再引入 SQLite。

## 架构形态

```txt
Frontend UI
  ↓
Local API Gateway
  ↓
Command Orchestrator
  ↓
npx skills / npx add-mcp
```

旁路能力：

```txt
OperationLog
SecretRedactor
TaskState
Cache
OptionalBackup
```

## 后端职责

- 提供固定 API，不暴露任意 shell 执行
- 校验前端参数
- 生成受控 CLI 命令
- 执行 `npx skills` / `npx add-mcp`
- 为写操作分配 task id，并通过进程内 TaskState 跟踪状态
- 通过 `GET /api/tasks/:id/stream` 返回脱敏后的 SSE 输出
- 记录操作日志（最终结果继续写入 JSONL）
- 脱敏敏感信息
- 必要时做轻量备份

## 前端职责

- 展示环境、Skills、MCP 操作入口
- 提供表单和确认弹窗
- 展示执行进度、结果和日志
- 不直接读写本地文件
- 不直接执行命令

## API 草案

```txt
GET  /api/status
GET  /api/skills/environments
GET  /api/skills/list
POST /api/skills/install
POST /api/skills/remove
POST /api/skills/update

POST /api/mcp/add

GET  /api/tasks/:id
GET  /api/tasks/:id/stream
GET  /api/logs
```

## 安全约束

- 不允许前端传入完整 shell 命令
- 所有命令参数白名单校验
- 日志默认脱敏 token / key / secret
- 写操作必须前端确认
- 不上传任何本地配置或密钥


## TaskStream-07 实现说明

- 写操作 `POST /api/skills/install`、`POST /api/skills/remove`、`POST /api/skills/update`、`POST /api/mcp/add` 现在返回 `{ taskId }`。
- server 使用进程内 `Map` 保存最近 100 个 task；task output 仅保存在内存中。
- `GET /api/tasks/:id` 返回完整 task 快照。
- `GET /api/tasks/:id/stream` 使用 SSE 推送 `snapshot / chunk / status` 事件；stdout/stderr/system 在进入 task state 前统一脱敏。
- task 完成后仍调用 LogPersistence-06 的 JSONL 持久化逻辑，`task.operationLogId` 关联最终 operation log。
- MVP 限制：不提供取消、重试、复杂队列或跨进程恢复。
