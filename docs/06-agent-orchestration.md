# 06. 代理编排方案

## 原则

- 小任务、短上下文、明确写入范围。
- 一个代理只负责一个边界清晰的任务。
- Backend / Frontend / Review 分离。
- 禁止多个代理同时改同一文件。

## 推荐任务流

```txt
PM 拆任务
  ↓
Backend Agent 实现 API / CLI Gateway
  ↓
Frontend Agent 接 UI
  ↓
Reviewer Agent 检查边界、安全、类型
  ↓
PM 合并结论并安排下一步
```

## 文件所有权

| 角色 | 主要文件 |
| --- | --- |
| Backend | `apps/server/**` |
| Frontend | `apps/web/**` |
| Shared | `packages/shared/**`，需 PM 明确授权 |
| Docs | `docs/**`, `AGENTS.md` |

## 当前推荐 Phase 2 任务拆分

1. Backend：增加受控 Skills 操作 API。
2. Frontend：增加 Skills scope 切换与列表刷新。
3. Backend：增加 add-mcp list-agents 结构化/原始输出接口。
4. Frontend：增加 MCP 页面原始输出展示。
5. Reviewer：检查是否存在任意命令执行风险。

## 2026-05-01 Merge / Release Orchestrator 补充

- Merge Orchestrator 只在最新 `origin/main` 的干净 worktree 上做集成，不在脏 `main` 或旧任务分支上直接合并。
- 对 tree 已等价于 `origin/main` 的分支，标记为“已合并，可归档”。
- 对基于旧主线且可能回退 `apps/web/**` 或其他已上线文件的分支，标记为“禁止直接合并”。
- 所有完成的代码任务必须走：commit → push → PR。
