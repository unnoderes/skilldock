# AGENTS.md

## Project

SkillDock：`npx skills` 与 `npx add-mcp` 的本地图形化控制台。

## Non-negotiable Boundaries

- 不重写 `npx skills` / `npx add-mcp` 已有能力。
- 不允许前端传任意 shell 命令。
- 所有 CLI 调用必须经 server 白名单 API。
- 日志必须脱敏 token/key/secret/password。
- MVP 优先可用，不做大而全抽象。

## Stack

- Monorepo: pnpm workspace
- Web: React + Vite + TypeScript
- Server: Fastify + TypeScript + execa
- Shared: `packages/shared`

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

## Repo Layout

```txt
apps/web      # 前端 UI
apps/server   # 本地 API / CLI Gateway
packages/shared # 共享类型
docs          # 设计与流程文档
```

## Coding Rules

- TypeScript strict。
- API 类型优先放 `packages/shared/src/index.ts`。
- server 只暴露固定业务 API。
- 调 CLI 使用 `execa(command, args)`，禁止拼接 shell 字符串。
- add-mcp 暂无 JSON 输出，MVP 只展示原始输出，不做复杂解析。
- 每次实现后至少运行：`pnpm typecheck`。

## Agent Roles

### PM / Orchestrator

负责：
- 拆任务
- 写触发提示
- 控制范围
- 分配代码任务
- 审查是否重复实现 CLI 能力

### Backend Agent

负责：
- Fastify API
- CLI 白名单封装
- 日志、脱敏、任务状态
- 不写前端 UI

### Frontend Agent

负责：
- React 页面
- 表单、状态展示、日志展示
- 不直接访问文件系统，不执行命令

### Reviewer Agent

负责：
- 检查边界违规
- 检查安全问题
- 检查类型与构建
- 输出简短 review 结论


## Version Control

- Main branch: `main`.
- Use task branches: `feat/*`, `fix/*`, `docs/*`, `chore/*`, `review/*`.
- Use simple Conventional Commits.
- One agent = one task branch when running parallel work.
- Avoid overlapping write scopes across agents.
- Before merge: inspect `git diff` and run `pnpm typecheck`.
- Every coding task must end with commit + push to its task branch.
- If the task is intended for `main`, provide PR base/head/title/body; do not leave completed work only in a local branch.
- Do not merge old-base branches directly if they would revert current `origin/main`; reapply the minimal fix on a fresh branch from `origin/main` instead.
- See `docs/09-version-control.md`.

## Definition of Done

- 功能符合 docs 范围。
- 没有重复实现 CLI 已有能力。
- `pnpm typecheck` 通过。
- 如涉及构建链路，`pnpm build` 通过。
- 已 commit 到任务分支。
- 已 push 到远程任务分支。
- 已提供 PR 链接或 PR 创建信息。
- 关键变更已更新相关 docs。
