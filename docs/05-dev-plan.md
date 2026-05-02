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

状态：主体功能已合入 `origin/main`，当前 commit：`2838e28`（Merge PR #3）。

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
- [ ] 基础任务状态 / 输出流
- [ ] 真实 CLI smoke test 与操作手册补充

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
