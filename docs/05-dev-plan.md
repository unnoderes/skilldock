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

- [ ] Skills project/global 切换
- [ ] Skills add/remove/update 表单
- [ ] add-mcp list-agents 页面
- [ ] add-mcp add 表单
- [ ] 命令执行日志持久化
- [ ] 基础任务状态 / 输出流
- [ ] 密钥脱敏规则完善

## 当前启动方式

```bash
pnpm install
pnpm dev
```

- Web: http://127.0.0.1:5173
- Server: http://127.0.0.1:3301
