# SkillDock

`npx skills` 与 `npx add-mcp` 的本地图形化控制台。

## Development

```bash
pnpm install
pnpm dev
```

- Web: http://localhost:5173
- Server: http://localhost:3301

Desktop development shell:

```bash
pnpm dev:desktop
```

Desktop packaging:

```bash
pnpm dist:desktop:win
pnpm dist:desktop:mac
```

Desktop release automation:

- `.github/workflows/release-desktop.yml`
- `workflow_dispatch` builds Windows/macOS desktop installers as GitHub Actions artifacts
- pushing a `v*` tag also uploads those installers to the matching GitHub Release

Notes:

- `pnpm dev:desktop` keeps the existing Vite + Fastify workflow and opens an Electron shell around it.
- Production desktop builds reuse `apps/server/dist` and `apps/web/dist`; the Electron main process still starts the local white-listed API server.
- Build Windows packages on Windows and macOS packages on macOS for the smoothest signing and packaging flow.

## npx Usage

SkillDock can be packaged as an npx-runnable local app. The published package exposes
the `skilldock` bin, starts the Fastify API server, and serves the built Vite UI from
the same local origin.

```bash
npx skilldock
```

Optional runtime flags:

```bash
npx skilldock --host 127.0.0.1 --port 3301
```

Local package smoke test:

```bash
pnpm build
npm pack
npx ./skilldock-0.0.0.tgz
```

## Docs

- MVP scope: [docs/03-mvp-scope.md](docs/03-mvp-scope.md)
- Dev plan: [docs/05-dev-plan.md](docs/05-dev-plan.md)
- Runtime smoke: [docs/11-runtime-smoke.md](docs/11-runtime-smoke.md)
- Project Context: [docs/project-context/README.md](docs/project-context/README.md)
- Release readiness review: [docs/12-mvp-release-readiness.md](docs/12-mvp-release-readiness.md)
