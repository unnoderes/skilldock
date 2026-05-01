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

## 当前 Phase 2 编排状态

已完成并合入 `origin/main`：

1. `CliGateway-01`：受控 Skills / MCP 写操作 API。
   - 主要范围：`apps/server/**`, `packages/shared/**`
   - 结果：zod 参数校验、`execa(command,args)` 调用、基础脱敏。
2. `SkillMcpConsole-02`：Skills / MCP MVP 操作 UI。
   - 主要范围：`apps/web/**`
   - 结果：scope 切换、Skills 表单、MCP add/list-agents 输出展示。
3. `PayloadContractFix-04`：修复 Skills install/update payload contract。
   - 主要范围：`apps/web/src/main.tsx`
   - 结果：install 使用 `skillNames`，update 使用 `names`。
4. `MergeReconcile-05`：整理旧分支与远程合并状态。
   - 结果：PR #3 已合入 `origin/main`，验证通过。

当前没有阻塞 Phase 2 主体功能合并的问题。

后续 Phase 2 候选卡：

1. `LogPersistence-06`：命令执行日志持久化。
   - 写入范围：`apps/server/**`, 必要时 `packages/shared/**`
   - 验收：日志落到本地 JSON；敏感字段落盘前脱敏；不暴露任意文件路径写入。
2. `TaskStream-07`：基础任务状态 / 输出流。
   - 写入范围：`apps/server/**`, `apps/web/**`, 必要时 `packages/shared/**`
   - 验收：长命令有 task id、状态查询与输出展示；不引入复杂队列。
3. `RuntimeSmoke-08`：真实 CLI smoke test 与操作手册补充。
   - 写入范围：`docs/**`
   - 验收：记录可重复的手工验证步骤与结果，不提交本地密钥或机器路径。

## Merge / Release 规则补充

- 所有 Coding Agent 完成代码后必须：`git diff` → 验证 → commit → push → 提供 PR 信息。
- 不允许只把完成工作留在本地分支。
- 不允许在脏 `main` 上直接开发或合并。
- 不允许直接合并旧基线分支；如可能回退 `origin/main`，必须在最新 `origin/main` 上重做最小修复。
- 远程分支清理必须由用户明确确认后再执行。
