# 09. 版本控制规范

## 分支

- 默认主分支：`main`
- 禁止直接在 `main` 上做大改动
- 功能分支命名：

```txt
feat/<short-name>
fix/<short-name>
docs/<short-name>
chore/<short-name>
review/<short-name>
```

示例：

```txt
feat/skills-actions-api
feat/mcp-add-form
docs/agent-workflow
```

## Commit 规范

使用简化 Conventional Commits：

```txt
feat: add skills install api
fix: handle add-mcp command error
docs: add agent orchestration guide
chore: initialize pnpm workspace
refactor: simplify command runner
```

允许类型：

```txt
feat, fix, docs, chore, refactor, test, build, ci
```

## Agent 开发规则

- 一个 agent 对应一个任务分支。
- 并行 agent 不应修改同一批文件。
- Backend Agent 优先改 `apps/server/**`。
- Frontend Agent 优先改 `apps/web/**`。
- Reviewer Agent 默认只读，除非明确要求修复。
- 合并前必须看 `git diff`。
- 完成代码任务后必须 commit 并 push 到远程任务分支。
- 必须提供 PR base/head/title/body；不允许只停留在本地分支。
- 旧基线分支如会回退 `origin/main`，禁止直接 merge，只能在最新 `origin/main` 上重做最小修复。

## 合并前检查

最低要求：

```bash
pnpm typecheck
```

涉及构建链路时：

```bash
pnpm build
```

## 禁止事项

- 禁止提交 `.env`、密钥、token。
- 禁止提交 `node_modules/`、`dist/`。
- 禁止在未说明原因时 force push。
- 禁止把 CLI 探测临时输出散落在根目录。
- 禁止绕过 `AGENTS.md` 的项目边界。

## 建议合并流程

```txt
基于 origin/main 创建任务分支
  ↓
实现最小改动
  ↓
git diff
  ↓
pnpm typecheck
  ↓
必要时 pnpm build
  ↓
git commit
  ↓
git push -u origin <task-branch>
  ↓
创建 PR：base=main, head=<task-branch>
  ↓
Reviewer 检查 diff / 类型 / 构建 / 边界
  ↓
合并回 main
```

## 当前分支清理建议（2026-05-02）

已合入或已被主线覆盖，用户确认后可清理：

```txt
origin/chore/phase2-merge-reconcile
origin/feat/skills-mcp-mvp-ui
origin/vk/2585-skilldock-backen
```

本地旧工作分支不建议直接合并，用户确认后可归档/删除：

```txt
feat/skills-mcp-mvp-ui
vk/1c3c-frontend-backend
vk/2585-skilldock-backen
vk/2784-skilldock-review
vk/5dc8-skilldock-merge
vk/6e62-skilldock-fronte
```
