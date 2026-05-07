# SkillDock Frontend Handoff

## Overview

The redesigned SkillDock frontend now combines the Vibe Kanban-inspired operational workspace style with functional API wiring from the local Fastify server. The app is implemented as a React + Vite + TypeScript frontend under `apps/web`.

## Structure

- `apps/web/src/App.tsx`: application shell, hash-based view routing, React Query provider, and active task handoff.
- `apps/web/src/components/`: global layout, sidebar, and task drawer.
- `apps/web/src/components/ui/`: reusable UI states such as confirmation dialog, empty state, loading skeletons, result panel, scope toggle, and status badges.
- `apps/web/src/hooks/`: React Query hooks for status, skills, MCP, logs, settings, and task streaming.
- `apps/web/src/lib/api.ts`: typed API client wrappers for the server endpoints.
- `apps/web/src/pages/`: Overview, Skills, MCP, Logs, and Settings views.
- `apps/web/src/styles/app.css`: Tailwind 4 theme tokens and shared global styles.

## API Usage

The frontend is wired to the existing server API:

- `GET /api/status`
- `GET /api/skills/list?scope=project|global`
- `POST /api/skills/install`
- `POST /api/skills/remove`
- `POST /api/skills/update`
- `GET /api/mcp/list?scope=project|global`
- `GET /api/mcp/list-agents`
- `POST /api/mcp/add`
- `GET /api/tasks/:id`
- `GET /api/tasks/:id/stream`
- `GET /api/logs?limit=N`
- `GET /api/settings`
- `PUT /api/settings`

## Workflow Notes

- Write operations use structured payloads and confirmation dialogs before calling the server.
- CLI output is displayed from server responses and task events; the frontend does not execute commands or construct shell strings.
- Task streaming uses `EventSource` with polling fallback in `useTask`.
- Logs and raw command output are presented in terminal-style panels with preserved server-side redaction.

## UI Notes

- The visual direction is an operational developer workspace: dense panels, restrained color, compact controls, and task/log/output-oriented surfaces.
- The layout is usable across desktop and narrow screens, but mobile interaction should receive another browser QA pass before release.
- `EmptyState`, `LoadingSkeleton`, and `ErrorBanner` are available for standardizing async states in future polish.
- `ConfirmDialog` is the canonical modal for guarded write actions.

## Known Follow-ups

1. Replace remaining inline loading placeholders with `LoadingSkeleton` where useful.
2. Add browser-based visual QA for mobile and desktop breakpoints.
3. Add focused regression tests for API payload contracts.
4. Review the current `as any` casts in write-action payloads and remove them once shared request types align with the frontend payload shape.
5. Consider a dedicated route abstraction if hash routing becomes limiting.
