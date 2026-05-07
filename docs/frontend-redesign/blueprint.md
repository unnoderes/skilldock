# SkillDock Frontend Redesign Blueprint

## 1. Vision & Core Principles

### Operational Developer Workspace
SkillDock is a tool for developers. The UI must be optimized for speed, clarity, and operational density. It should feel like a dedicated command center, not a consumer application.

### Design Principles (Vibe Kanban Inspired)
- **High Information Density:** Maximum utility per pixel. Use compact tables, monospace fonts for technical data, and clear visual hierarchies.
- **Restrained Aesthetics:** A sober color palette (grays, deep blues, slate) with accent colors used only for functional status (success/error/warning).
- **Workflow-First:** Navigation and actions should mirror the developer's mental model of managing Skills and MCP servers.
- **Contextual Awareness:** Always show the health of the environment and the state of the CLI.

---

## 2. Security Boundary & Technical Architecture

### Non-Negotiable Rules
- **No Arbitrary Shell Access:** The frontend never sends strings to be executed.
- **Fixed API Mapping:** All UI actions map to specific, server-defined endpoints (`POST /api/skills/install`, etc.).
- **Server-Side Truth:** The frontend reflects state; it does not manage it (e.g., it doesn't write to `config.json`).
- **Controlled Redaction:** Logs and task outputs are filtered server-side before reaching the frontend.

---

## 3. Page Hierarchy & Navigation

### Global Layout
- **Sidebar (Left):** Permanent navigation with high-level environment status (CLI Health indicator).
- **Main Stage (Center):** The primary workspace for the selected view.
- **Task Drawer/Overlay (Bottom or Right):** A persistence surface for live task output (stdout/stderr) from active operations.

### Main Views
1.  **Overview (Dashboard)**
    - Environment health (Node, pnpm, CLI versions).
    - Recent activity timeline.
    - Active task summary.
2.  **Skills Manager**
    - Scope toggle: Project vs. Global.
    - Searchable list of skills with current status.
    - Actions: Install, Update, Remove.
3.  **MCP Center**
    - List of configured MCP servers.
    - Agent registry.
    - "Add MCP" wizard (structured form based on agents).
4.  **Activity Logs**
    - Full history of all SkillDock operations.
    - Drill-down for command details, args, and duration.
5.  **Settings**
    - UI preferences (theme, log limits).
    - Default CLI scopes.

---

## 4. Key Workflows

### Workflow: Installing a Skill
1. User navigates to **Skills**.
2. Clicks "Install Skill".
3. Enters skill name in a controlled input.
4. UI calls `POST /api/skills/install`.
5. Frontend receives a `taskId`.
6. UI opens the **Task Output Surface** automatically.
7. User watches live stream (`GET /api/tasks/:id/stream`).
8. Task completes; UI refreshes Skill list.

### Workflow: Adding an MCP Server
1. User navigates to **MCP**.
2. Clicks "Add MCP Server".
3. Selects an **Agent** from a dropdown (`GET /api/mcp/list-agents`).
4. Form dynamically populates based on agent requirements (no raw JSON input).
5. UI calls `POST /api/mcp/add`.
6. User monitors task output until completion.

---

## 5. UI States & Data Presentation

### Component Standards
- **Tables:** Sortable, searchable, compact rows.
- **Status Pills:** Small, high-contrast indicators (e.g., `Active` in green, `Error` in red, `Idle` in gray).
- **Log Surfaces:** Monospace text, syntax highlighting for CLI output, automatic scrolling with manual override.

### Critical States
- **CLI Unavailable:** Global banner if `GET /api/status` returns failure. Actions are disabled.
- **Running Task:** Global indicator in sidebar/header; Task Drawer is accessible from anywhere.
- **Empty States:** Guidance on how to get started (e.g., "No Skills found. Try installing one.")

---

## 6. Handoff for Implementation

### Technical Stack
- **Framework:** React + Vite + TypeScript.
- **State Management:** React Query (TanStack Query) for API synchronization and caching.
- **Styling:** Tailwind CSS (for layout) + Headless UI (for accessible components).
- **Icons:** Lucide React (clean, stroke-based).

### Next Steps for Implementation Agent
1. Setup React Query and API client wrappers for all listed endpoints.
2. Implement the Global Layout (Sidebar + Main Stage + Task Drawer).
3. Build the Overview page to verify end-to-end connectivity with `/api/status`.
4. Proceed view-by-view, starting with Skills.
