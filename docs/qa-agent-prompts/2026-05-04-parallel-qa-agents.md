# Parallel QA Agents Prompt Pack — 2026-05-04

- Context Window: `QAPromptPack-20260504-01`
- Role: QA / PM Orchestrator prompt design only
- Purpose: Provide ready-to-paste prompts for manually assigned independent QA agents.
- Important boundary: This file is a prompt-design artifact only. The orchestrator must not execute the concrete tests described here.

## Orchestrator Boundary

The orchestrator is responsible only for:

- QA agent layout design
- prompt design
- acceptance criteria design
- risk boundary definition
- bug card format definition
- repair-agent prompt templates
- consolidation guidance

The orchestrator must not:

- run concrete functional tests
- start dev servers
- execute write-path API checks
- modify product code
- directly verify UI behavior
- merge branches
- force push

## Agent Layout Summary

| ID | Name | Mode | Scope | Suggested branch |
|---|---|---|---|---|
| T1 | BaselineReadonlySmoke | parallel | origin/main baseline, typecheck/build, read-only API smoke, release/tag traceability | `docs/qa-baseline-readonly-smoke` |
| T2 | UIWorkflowRegression | parallel | Web UI pages, scope switching, Settings, Logs, form state, no arbitrary shell entry | `docs/qa-ui-workflow-regression` |
| T3 | TaskStreamRedactionRegression | parallel, opt-in write scope | Safe failing write operation, task id/status, SSE, polling fallback, logs, redaction | `docs/qa-taskstream-redaction` |
| T4 | SecurityBoundaryRegression | parallel | Server whitelist APIs, execa usage, schema validation, negative security tests, redaction paths | `docs/qa-security-boundary` |

---

# Agent Prompt 1

## Agent 1 — [T1] BaselineReadonlySmoke

### Background
SkillDock is a pnpm monorepo for a local GUI console around `npx skills` and `npx add-mcp`. The stack is React + Vite + TypeScript for `apps/web`, Fastify + TypeScript + execa for `apps/server`, and shared API types in `packages/shared`. The project is in post-MVP QA mode; your job is testing and reporting, not implementation. Use the latest `origin/main` as the only valid baseline.

### Task
Run a baseline and read-only smoke verification for SkillDock MVP. Verify repository state, release tag traceability, install/typecheck/build, read-only server APIs, and runtime smoke documentation executability. Do not perform install/remove/update/add write operations.

### Constraints & conventions
- Git: create branch `docs/qa-baseline-readonly-smoke` off latest `origin/main`; open a PR targeting `main` when done.
- Do not fix code. If you find a product issue, write a bug card and a repair-agent prompt.
- Do not use local dirty `main` as baseline.
- Do not execute destructive or write CLI operations.
- Do not commit `.env`, `node_modules`, `dist`, local config, `~/.skilldock/logs/**`, or raw smoke outputs.
- QA report path: `docs/undone-development-plan/qa-YYYYMMDD-01-baseline-readonly-smoke.md`.
- Run at minimum: `pnpm install`, `pnpm typecheck`, `pnpm build`.
- If runtime ports are occupied, record an environment blocker instead of killing unknown processes.

### Acceptance criteria
- [ ] `origin/main` commit and branch status are recorded.
- [ ] `v0.1.0-mvp` tag existence and target commit are recorded.
- [ ] `pnpm install`, `pnpm typecheck`, and `pnpm build` results are recorded.
- [ ] Read-only APIs are tested: `/healthz`, `/api/status`, `/api/settings`, `/api/logs?limit=5`, `/api/skills/list?scope=project`, `/api/skills/list?scope=global`, `/api/mcp/list?scope=project`, `/api/mcp/list?scope=global`, `/api/mcp/list-agents`.
- [ ] Each test item has expected result, actual result, and pass/fail/blocker status.
- [ ] Any issue includes a full bug card: Bug ID, severity, impact, reproduction steps, expected result, actual result, files/APIs, suggested fix scope, prohibitions, acceptance criteria, and repair-agent prompt.
- [ ] Report is committed, pushed, and a PR is created or PR base/head/title/body is provided.

---

# Agent Prompt 2

## Agent 2 — [T2] UIWorkflowRegression

### Background
SkillDock provides a local web UI for controlled access to `npx skills` and `npx add-mcp`. The UI must never expose arbitrary shell command execution, arbitrary file path editing, or direct filesystem access. This task focuses on user-facing UI behavior only; do not modify source code.

### Task
Perform a browser-based UI regression pass covering Overview/status, Skills list/forms, MCP list/list-agents/add form presentation, Settings, Logs, scope switching, loading/error states, and visible safety boundaries. Prefer browser automation or manual browser inspection. Avoid submitting write operations unless explicitly authorized in this prompt’s execution context.

### Constraints & conventions
- Git: create branch `docs/qa-ui-workflow-regression` off latest `origin/main`; open a PR targeting `main` when done.
- Do not fix code. Report bugs only.
- Do not perform destructive operations.
- Do not use real token/key/secret/password.
- If Settings changes are tested, use an isolated environment or clearly record the local config impact.
- Do not submit Skills install/remove/update or MCP add write forms unless the human explicitly opts in for this UI test.
- QA report path: `docs/undone-development-plan/qa-YYYYMMDD-02-ui-workflow-regression.md`.
- If browser tooling is unavailable, record a blocker and include exact error output.

### Acceptance criteria
- [ ] UI loads at `http://127.0.0.1:5173`.
- [ ] Overview/status displays SkillDock and CLI status.
- [ ] Skills project/global scope switching triggers expected UI refresh and does not expose arbitrary command input.
- [ ] MCP project/global list and list-agents output are visible as controlled CLI results.
- [ ] Write forms clearly represent controlled operations only and do not allow arbitrary shell commands.
- [ ] Settings only exposes safe preferences: default scopes, logs limit, raw output collapse preference.
- [ ] CLI command labels, config path, and log path are read-only display metadata.
- [ ] Logs UI displays recent operation entries and supports limit adjustment.
- [ ] UI does not expose direct filesystem access, arbitrary command path editing, or shell execution.
- [ ] Every UI issue includes screenshot/snapshot evidence when possible and a full bug card.
- [ ] Report is committed, pushed, and a PR is created or PR base/head/title/body is provided.

---

# Agent Prompt 3

## Agent 3 — [T3] TaskStreamRedactionRegression

### Background
SkillDock write operations are asynchronous. The server returns `{ taskId }`, stores active task state in memory, streams output via SSE, supports polling fallback, persists operation logs, and redacts token/key/secret/password-like values from args/stdout/stderr/task output/logs. This task intentionally exercises safe failing write paths to validate the runtime task pipeline.

### Task
Run an opt-in TaskStream and redaction regression test using only safe fake values. Prefer write operations that are expected to fail without installing real packages or adding real services. Validate task creation, task status progression, SSE stream behavior, polling fallback, operation log persistence, and redaction across all returned surfaces.

### Constraints & conventions
- Git: create branch `docs/qa-taskstream-redaction` off latest `origin/main`; open a PR targeting `main` when done.
- This prompt authorizes only the specific safe failing write tests needed for TaskStream/redaction validation. Do not perform successful real installs or add real MCP services.
- Do not use real token/key/secret/password.
- Use fake values such as `Authorization: Bearer sk-test-REDACTED-EXAMPLE`, `API_KEY=fake-test-key`, and `PASSWORD=fake-password`.
- Prefer isolated project directory and isolated HOME/config/log environment where practical.
- Do not clean, overwrite, or delete user configuration except for clearly isolated test artifacts.
- Do not fix code. Report bugs only.
- QA report path: `docs/undone-development-plan/qa-YYYYMMDD-03-taskstream-redaction.md`.

### Acceptance criteria
- [ ] A safe failing `POST /api/skills/install` or equivalent controlled write returns `{ taskId }`.
- [ ] `GET /api/tasks/:id` returns a task with `id`, `source`, `status`, timestamps, output chunks, final result or error, and operationLogId after completion where applicable.
- [ ] `GET /api/tasks/:id/stream` produces an initial snapshot and observable chunk/status events, or any failure is clearly documented.
- [ ] Polling fallback via repeated `GET /api/tasks/:id` can observe final task state.
- [ ] `GET /api/logs?limit=5` includes the corresponding operation entry after task completion.
- [ ] Fake secrets do not appear unredacted in task output, task final result args/stdout/stderr, API logs response, or persisted operation logs.
- [ ] Expected MVP limitation is respected: task state may not survive server restart.
- [ ] Any defect includes full bug card plus repair-agent prompt.
- [ ] Report is committed, pushed, and a PR is created or PR base/head/title/body is provided.

---

# Agent Prompt 4

## Agent 4 — [T4] SecurityBoundaryRegression

### Background
SkillDock’s non-negotiable security boundaries are: do not reimplement `npx skills` or `npx add-mcp`; frontend must not pass arbitrary shell commands; all CLI calls must go through fixed server whitelist APIs; server CLI execution must use `execa(command, args)` without shell string concatenation; logs and outputs must redact token/key/secret/password values. This task audits those boundaries through source review and safe negative API tests.

### Task
Perform a security boundary regression review. Verify server route surface, CLI whitelist construction, execa usage, schema validation, settings safety, frontend API usage, and redaction coverage. Use only safe negative tests that should be rejected by schema or remain inert; do not trigger real write operations unless explicitly needed and safe.

### Constraints & conventions
- Git: create branch `docs/qa-security-boundary` off latest `origin/main`; open a PR targeting `main` when done.
- Do not fix code. Report bugs only.
- Do not run arbitrary shell through the app.
- Do not perform destructive operations.
- Do not use real secrets.
- Do not add dependencies.
- QA report path: `docs/undone-development-plan/qa-YYYYMMDD-04-security-boundary.md`.
- Source areas to inspect include `apps/server/src`, `apps/web/src`, and `packages/shared/src`.

### Acceptance criteria
- [ ] Server exposes only fixed business APIs; no arbitrary command execution endpoint exists.
- [ ] All server CLI calls use `execa(command, args)` with argument arrays, not shell string concatenation.
- [ ] CLI args are built from schema-validated request bodies and fixed flags.
- [ ] Frontend calls only fixed server API paths and does not access filesystem or execute commands.
- [ ] Settings API allows only safe preferences and does not allow CLI path, command path, config path, log path, or arbitrary filesystem path editing.
- [ ] Redaction is applied to args, stdout, stderr, task output chunks, task final result, and operation logs.
- [ ] Invalid payload tests return structured errors and do not start CLI tasks.
- [ ] Any boundary violation includes full bug card, exact files/APIs, severity, and repair-agent prompt.
- [ ] Report is committed, pushed, and a PR is created or PR base/head/title/body is provided.

---

## Aggregate Acceptance Criteria

After all agents complete their work, the integrating engineer or orchestrator should verify:

- [ ] All QA report files are stored under `docs/undone-development-plan/`.
- [ ] Every QA agent used latest `origin/main`, not a dirty local `main`.
- [ ] Every QA agent branch is pushed and has a PR or PR base/head/title/body.
- [ ] Every report includes Context Window, test scope, acceptance criteria, and risk boundary.
- [ ] Product bugs and test-environment blockers are clearly separated.
- [ ] Every bug card includes reproduction steps, expected result, actual result, suggested fix scope, prohibitions, acceptance criteria, and repair-agent prompt.
- [ ] No agent fixed code, merged `main`, force-pushed, or committed local config / real secrets.
- [ ] If TaskStream write-path testing was performed, it used only fake values and safe failing paths.
- [ ] Final consolidation states whether MVP remains release-ready; if not, blocker/high bug cards are listed.
