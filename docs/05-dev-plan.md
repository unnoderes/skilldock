# 05. 开发计划

## Phase 1：CLI 调用链路闭环

状态：已初始化。

- [x] 初始化 pnpm monorepo
- [x] 创建 `packages/shared`
- [x] 创建 `apps/server`
- [x] 创建 `apps/web`
- [x] server 调用 `npx skills --version`
- [x] server 调用 `npx add-mcp --version`
- [x] web 展示 CLI 状态、全局 Skills、MCP list 输出
- [x] `pnpm typecheck` 通过
- [x] `pnpm build` 通过

## Phase 2：MVP 操作能力

状态：MVP 主体功能已合入 `origin/main`；截至 2026-05-03 的 release review 基线为 `origin/main@1023bcd`。

已完成：

- [x] Skills project/global 切换
- [x] Skills add/remove/update 表单
- [x] add-mcp list-agents 输出展示
- [x] add-mcp add 表单
- [x] 密钥脱敏规则完善：stdout/stderr/args 已做基础脱敏
- [x] Payload contract 修复：install 使用 `skillNames`，update 使用 `names`
- [x] 合并工作流修正：完成任务必须 commit、push，并提供 PR 信息

验证记录：

- 验证基线：`origin/main@2838e28`
- 临时 worktree：`/tmp/skilldock-final-check-lmgG1d`
- 已通过：
  - `pnpm install`
  - `pnpm typecheck`
  - `pnpm build`

仍未完成 / 后续卡：

- [x] 命令执行日志持久化（server 端 JSONL 落盘与最近日志查询）
- [x] 基础任务状态 / 输出流
- [x] 真实 CLI smoke test 与操作手册补充
- [x] Settings 安全偏好页与只读 metadata 展示
- [x] Logs 页面与最近 operation logs 展示
- [x] Release readiness 文档审查

分支处理状态：

- 已合入主线：`origin/chore/phase2-merge-reconcile`
- 已等价或被主线覆盖，可归档：`origin/feat/skills-mcp-mvp-ui`
- 不建议直接合并，避免旧基线回退：`origin/vk/2585-skilldock-backen`、`vk/1c3c-frontend-backend`

## 当前启动方式

```bash
pnpm install
pnpm dev
```

- Web: http://127.0.0.1:5173
- Server: http://127.0.0.1:3301

## 2026-05-01 Merge Reconcile

- 当前集成分支：`chore/phase2-merge-reconcile`
- 已合并到 `origin/main`：`origin/feat/skills-mcp-mvp-ui`
- 禁止直接合并：`vk/2585-skilldock-backen`、`origin/vk/2585-skilldock-backen`、`feat/skills-mcp-mvp-ui`、`vk/1c3c-frontend-backend`、`main`、`vk/2784-skilldock-review`、`vk/6e62-skilldock-fronte`、`vk/5dc8-skilldock-merge`
- 处理策略：对旧基线分支只提取有效修复意图，在最新 `origin/main` 上手动重做最小改动。
- 本次最小修复：对齐 Skills install/update payload 字段名，避免前后端 contract 不一致。
- 验证目标：`pnpm install`、`pnpm typecheck`、`pnpm build`。


## 2026-05-02 TaskStream-07

已完成：

- [x] 4 个写操作 API 改为异步 task 启动，返回 `taskId`
- [x] 新增 `GET /api/tasks/:id` 与 `GET /api/tasks/:id/stream`
- [x] server 以内存 Map 保存最近 task，并对 stdout/stderr/system 做脱敏
- [x] web 展示 task id、status、输出流、最终 `CommandResult`、`operationLogId`
- [x] task 完成后继续写入 `~/.skilldock/logs/operations.jsonl`

MVP 限制：

- task active state 仅保存在当前 server 进程内
- 浏览器实时输出优先使用 SSE，断开后回退短轮询
- 不提供取消、重试、复杂调度

## 2026-05-02 RuntimeSmoke-08

已完成：

- [x] 新增 `docs/11-runtime-smoke.md`，覆盖 read-only API、TaskStream、operation logs、Web UI、redaction 检查
- [x] README 增加 runtime smoke 文档入口
- [x] 明确区分只读检查与 opt-in 写操作检查
- [x] 明确 TaskStream MVP 限制：task active state 仅保存在当前 server 进程内

验证目标：

- `pnpm typecheck`
- `pnpm build`

## 2026-05-03 MvpReleaseReview-11

结论：**Pass with caveats**

已验证：

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
- `POST /api/mcp/add` 的 task / logs / redaction 链路（使用假 header / env，检查后已清理测试配置）

审查结果摘要：

- 安全边界保持成立：前端没有任意 shell 输入；server 仅暴露固定业务 API；CLI 调用继续使用 `execa(command, args)`；task / logs / result 中的敏感字段会脱敏；Settings 不允许编辑 CLI 路径或任意命令。
- MVP 页面覆盖已达成：Overview/status、Skills、MCP、Logs、Settings、Task output 均已存在。
- 文档已补齐：本次同步修正文档中对 Settings、Logs、Task output 与 release review 的描述。

注意事项：

- task active state 仍只保存在当前 server 进程内，server 重启后旧 `taskId` 不保证可查询。
- `add-mcp` 远程 target 的成功不代表服务可连通；当前 MVP 仅保证受控调用、task 状态、原始输出展示与日志链路。
