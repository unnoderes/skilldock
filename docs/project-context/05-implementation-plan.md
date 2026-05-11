# 05. Implementation Plan

## Phase 0：设计冻结

目标：

- 明确 Project Context 不是 UI filter。
- 明确安全边界。
- 明确 API contract。
- 明确分阶段任务。

产物：

- `docs/project-context/**`

## Phase 1：Shared Types 与 Backend Project Registry

写范围：

- `packages/shared/src/index.ts`
- `apps/server/src/index.ts`

目标：

- 新增 Project 类型。
- 新增 `~/.skilldock/projects.json` 读写。
- server 启动目录自动注册为 launch project。
- 实现 `GET /api/projects`。
- 实现 `POST /api/projects`。
- 实现 `PUT /api/projects/active`。
- 实现 `DELETE /api/projects/:id`。

验收：

- `pnpm typecheck`
- API 能返回 launch project。
- 添加不存在路径返回 400。
- 添加有效目录成功。
- active project 可切换。

## Phase 2：CLI CWD Integration

写范围：

- `packages/shared/src/index.ts`
- `apps/server/src/index.ts`

目标：

- `runCli` / `runCliTask` 支持 `cwd`。
- Skills project-scope APIs 支持 `projectId`。
- MCP project-scope APIs 支持 `projectId`。
- task/log 记录 project context。
- project-scope 写操作在 invalid project 上失败。

验收：

- `pnpm typecheck`
- 在两个不同本地目录执行 `GET /api/skills/list?scope=project&projectId=...`，结果来自各自 cwd。
- install task 记录 project metadata。
- operation log 记录 project metadata。
- global scope 仍加 `--global`。

## Phase 3：Frontend Project Context

写范围：

- `apps/web/src/lib/api.ts`
- `apps/web/src/hooks/**`
- `apps/web/src/contexts/**`
- `apps/web/src/components/**`

目标：

- 新增 Projects API client。
- 新增 `useProjects` / `ProjectContext`。
- Sidebar 或 Layout 增加 Project Selector。
- Add Project modal。
- Switch Project flow。
- invalid project 状态展示。

验收：

- `pnpm typecheck`
- UI 显示 launch project。
- 可添加有效路径。
- 可切换 active project。
- 切换后 Skills/MCP query invalidated。

## Phase 4：Skills / MCP Integration

写范围：

- `apps/web/src/pages/Skills.tsx`
- `apps/web/src/pages/Mcp.tsx`
- `apps/web/src/hooks/useSkills.ts`
- `apps/web/src/hooks/useMcp.ts`
- 相关确认弹窗文案

目标：

- Skills query key 带 active projectId。
- MCP query key 带 active projectId。
- 写操作 payload 带 projectId。
- 确认弹窗显示 project context。
- project invalid 时禁用 project-scope 写操作。

验收：

- 切换项目后 Skills 列表刷新。
- 切换项目后 MCP list 刷新。
- install/remove/update/add MCP 的确认弹窗展示目标 project。
- task drawer 展示 project。

## Phase 5：Logs / Task / Settings Polish

写范围：

- `apps/web/src/components/TaskDrawer.tsx`
- `apps/web/src/pages/Logs.tsx`
- `apps/web/src/pages/Settings.tsx`
- `apps/web/src/lib/i18n.ts`

目标：

- Task Drawer 显示 project metadata。
- Logs 显示 project metadata。
- Settings 显示 projects registry path。
- i18n 文案补齐。

验收：

- `pnpm typecheck`
- 日志详情可看出 project。
- task 运行期间切换 project，不影响 task 显示的 project。

## Phase 6：Runtime Smoke

手动检查：

1. 启动 SkillDock。
2. `GET /api/projects` 返回 launch project。
3. 添加两个临时目录。
4. 分别切换 active project。
5. Skills Project scope 列表请求使用对应 cwd。
6. MCP Project scope 列表请求使用对应 cwd。
7. 对其中一个项目执行 opt-in install 或 mock-safe 操作。
8. task/log 记录对应 project。
9. 删除 recent project，不删除磁盘目录。

## 推荐分支序列

```txt
feat/project-registry-api
feat/project-cli-cwd
feat/project-selector-ui
feat/project-context-pages
feat/project-context-logs
docs/project-context-smoke
```

## 合并策略

- Phase 1 和 Phase 2 可以连续实现，但建议分 PR，降低审查难度。
- Frontend selector 不应早于 backend project API 合入。
- Logs/Task polish 应在 task/log metadata 合入后做。
- 每个 PR 最低运行 `pnpm typecheck`。
- 涉及前端 UI 的 PR 运行 `pnpm build`。

