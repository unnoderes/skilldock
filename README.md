# SkillDock

`npx skills` 与 `npx add-mcp` 的本地图形化控制台。

## Development

```bash
pnpm install
pnpm dev
```

- Web: http://localhost:5173
- Server: http://localhost:3301

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
- Release readiness review: [docs/12-mvp-release-readiness.md](docs/12-mvp-release-readiness.md)
