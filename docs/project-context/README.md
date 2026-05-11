# Project Context / Multi-Project Management

本目录记录 SkillDock 多项目管理能力的设计产物。

该功能的核心不是“按项目筛选 UI 列表”，而是引入一个明确的 **Project Context**：

```txt
Project Selector
  ↓
server 解析为受信任 projectId
  ↓
CLI Gateway 使用该 project 的 cwd 执行 project-scope 命令
  ↓
Skills / MCP / Tasks / Logs 展示同一个 project context
```

## 文档索引

- [01. Product Requirements](01-product-requirements.md)
- [02. Architecture And Data Model](02-architecture-and-data-model.md)
- [03. API Contract](03-api-contract.md)
- [04. Frontend Workflows](04-frontend-workflows.md)
- [05. Implementation Plan](05-implementation-plan.md)
- [06. Agent Task Cards](06-agent-task-cards.md)
- [07. Runtime Smoke Checklist](07-runtime-smoke.md)

## 一句话目标

让用户可以在 SkillDock 内注册、切换和管理多个本地项目，并让 `Project` scope 下的 `npx skills` / `npx add-mcp` 操作明确作用于当前选中的项目目录。

## 关键边界

- 前端不执行命令。
- 前端不传完整 shell 命令。
- 前端不在每个 CLI API 中直接传任意路径。
- server 只接受经过验证和注册的 `projectId`。
- CLI 仍通过固定白名单 API 和 `execa(command, args, { cwd })` 执行。
- 不自建 Skills registry。
- 不自写 MCP 配置文件解析器。
