# 12. MVP Release Readiness Review

审查日期：2026-05-03

审查基线：

- 分支：`review/mvp-release-readiness`
- 基线：`origin/main@1023bcd7569aaa05406c1c95b73bd64208a0ef71`

## 结论

**Pass with caveats**

SkillDock 当前主线已经具备 MVP 发布所需的核心页面、受控 CLI 网关、task 输出、日志与 settings 能力；静态校验与构建通过，运行时只读检查通过，task / logs / redaction 链路通过。

## 本次验证

已执行：

- `pnpm install`
- `pnpm typecheck`
- `pnpm build`
- `GET /healthz`
- `GET /api/status`
- `GET /api/settings`
- `GET /api/logs?limit=3`
- `GET /api/skills/list?scope=project`
- `GET /api/mcp/list?scope=project`
- `GET /api/mcp/list-agents`
- `POST /api/mcp/add`（使用假 header / env 验证 task、logs、redaction；检查后已清理测试配置）

运行时观察：

- `skills --version` 正常返回 `1.5.3`
- `add-mcp --version` 正常返回 `1.8.0`
- `/api/settings` 返回结构化安全偏好与只读 metadata
- `/api/logs` 返回 JSONL 落盘后的最近操作
- 写操作返回 `taskId`，可通过 task API 查询最终状态
- `Authorization` / `API_KEY` 在 task 与 logs 中均被替换为 `[REDACTED]`

## 安全边界检查

- [x] 前端没有任意 shell 输入能力
- [x] server 只暴露固定业务 API
- [x] CLI 调用使用 `execa(command, args)`，无 shell 字符串拼接
- [x] `args` / `stdout` / `stderr` / task chunk / operation logs 有脱敏
- [x] Settings 不允许编辑 CLI 路径、命令路径或任意路径

## MVP 页面检查

- [x] Overview/status
- [x] Skills
- [x] MCP
- [x] Logs
- [x] Settings
- [x] Task output

## Caveats

1. task active state 仅保存在 server 当前进程内；server 重启后旧 `taskId` 可能不可查询。
2. `add-mcp` 远程安装的成功主要代表配置写入成功，不代表目标服务一定可连通。
3. 当前 `add-mcp` 输出仍以原始 CLI 文本展示为主，不做复杂解析；这是已知 MVP 范围内行为。

## 文档同步

本次已同步：

- 修正 MVP scope 中对 Settings / Task output 的描述
- 补充 dev plan 中的 release review 结论
- 更新 orchestration 文档中的已完成卡片
- 补充 runtime smoke 对 Settings / Logs 的检查项
- 更新 README 文档入口

## 分支清理建议

以下远程分支已被 `origin/main` 覆盖，可在确认无保留需求后统一清理：

- `origin/docs/runtime-smoke`
- `origin/feat/logs-settings-console`
- `origin/feat/operation-log-persistence`
- `origin/feat/settings-config`
- `origin/feat/task-stream`

说明：按仓库规则，是否删除远程分支仍需用户明确确认后执行。
