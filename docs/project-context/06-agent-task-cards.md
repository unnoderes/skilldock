# 06. Agent Task Cards

本文件提供后续执行 agent 的任务拆分草案。每张卡应在最新 `origin/main` 上创建独立任务分支，避免并行写同一批文件。

## Task 1：Project Registry Backend

Branch:

```txt
feat/project-registry-api
```

Write Scope:

- `packages/shared/src/index.ts`
- `apps/server/src/index.ts`
- optional docs update in `docs/project-context/**`

Goal:

- Add shared project types.
- Add local project registry persistence at `~/.skilldock/projects.json`.
- Auto-register launch project from `process.cwd()`.
- Implement:
  - `GET /api/projects`
  - `POST /api/projects`
  - `PUT /api/projects/active`
  - `DELETE /api/projects/:id`

Constraints:

- Do not wire Skills/MCP cwd yet.
- Do not modify frontend pages.
- Validate paths on server.
- Store canonical `realpath`.

Validation:

```bash
pnpm typecheck
```

Manual API checks:

```txt
GET /api/projects
POST /api/projects with valid absolute directory
POST /api/projects with missing path
PUT /api/projects/active
DELETE /api/projects/:id
```

## Task 2：CLI CWD Integration

Branch:

```txt
feat/project-cli-cwd
```

Dependencies:

- Task 1 merged.

Write Scope:

- `packages/shared/src/index.ts`
- `apps/server/src/index.ts`

Goal:

- Add `projectId?: string` to Skills/MCP request types.
- Resolve project context for project-scope APIs.
- Add `cwd` support to `runCli` and `runCliTask`.
- Record project context in task records and operation logs.
- Keep backward compatibility by falling back to active project if projectId is omitted.

Constraints:

- Do not accept raw path in Skills/MCP APIs.
- Do not change CLI args except existing scope flags.
- Do not implement frontend selector.

Validation:

```bash
pnpm typecheck
```

Manual checks:

```txt
GET /api/skills/list?scope=project&projectId=<id>
GET /api/mcp/list?scope=project&projectId=<id>
POST /api/skills/install with projectId on a safe opt-in package, if approved
GET /api/tasks/:id includes project
GET /api/logs includes project
```

## Task 3：Project Selector UI

Branch:

```txt
feat/project-selector-ui
```

Dependencies:

- Task 1 merged.

Write Scope:

- `apps/web/src/lib/api.ts`
- `apps/web/src/hooks/**`
- `apps/web/src/contexts/**`
- `apps/web/src/components/Sidebar.tsx`
- optional new components under `apps/web/src/components/**`
- `apps/web/src/lib/i18n.ts`

Goal:

- Add frontend project API client.
- Add project context provider or hook.
- Show active project in the app shell.
- Add selector popover/dialog.
- Add local project path modal.
- Switch active project.
- Show invalid/missing project state.

Constraints:

- Do not modify server.
- Do not wire Skills/MCP payloads yet, unless Task 2 is already merged and scope is explicitly expanded.
- Do not add filesystem browser.

Validation:

```bash
pnpm typecheck
pnpm build
```

Browser checks:

```txt
Sidebar shows launch project
Add project path works
Invalid path shows error
Switch project updates active project
Mobile width does not overflow
```

## Task 4：Skills / MCP Project Context Integration

Branch:

```txt
feat/project-context-pages
```

Dependencies:

- Task 2 merged.
- Task 3 merged.

Write Scope:

- `apps/web/src/hooks/useSkills.ts`
- `apps/web/src/hooks/useMcp.ts`
- `apps/web/src/pages/Skills.tsx`
- `apps/web/src/pages/Mcp.tsx`
- relevant components and i18n

Goal:

- Query Skills with active `projectId`.
- Query MCP with active `projectId`.
- Include `projectId` in write payloads.
- Show project context in write confirmations.
- Disable project-scope writes for invalid project.

Constraints:

- Do not change backend contracts.
- Do not redesign Skills/MCP unrelated flows.
- Keep Global scope semantics clear.

Validation:

```bash
pnpm typecheck
pnpm build
```

Browser checks:

```txt
Switch project refreshes Skills project list
Switch project refreshes MCP project list
Install confirmation shows project
Remove/update confirmation shows project
MCP add confirmation shows project
Global scope still works
```

## Task 5：Task And Logs Project Metadata UI

Branch:

```txt
feat/project-context-logs
```

Dependencies:

- Task 2 merged.

Write Scope:

- `apps/web/src/components/TaskDrawer.tsx`
- `apps/web/src/pages/Logs.tsx`
- `apps/web/src/pages/Settings.tsx`
- `apps/web/src/lib/i18n.ts`

Goal:

- Display project metadata in Task Drawer.
- Display project metadata in Logs summary/detail.
- Optionally show projects registry path in Settings metadata.

Constraints:

- Do not modify backend unless a small field-name mismatch fix is required.
- Do not redesign Logs beyond project metadata placement.

Validation:

```bash
pnpm typecheck
pnpm build
```

Browser checks:

```txt
Task drawer shows project name/path
Logs show project name/path
Long paths wrap or truncate cleanly
```

## Task 6：Runtime Smoke Doc

Branch:

```txt
docs/project-context-smoke
```

Dependencies:

- Tasks 1-5 merged.

Write Scope:

- `docs/project-context/**`
- `docs/11-runtime-smoke.md`
- optional README link

Goal:

- Add a manual smoke checklist for multi-project workflows.
- Document known caveats.
- Document opt-in write-operation checks.

Validation:

```bash
pnpm typecheck
```

