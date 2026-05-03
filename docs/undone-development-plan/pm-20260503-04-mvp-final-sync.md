# PM Final Sync — 2026-05-03 MVP Closure

## Final MVP Status

结论：**SkillDock v0.1.0 MVP 已完成，带已知 caveats。**

本次收尾基于干净基线 `origin/main@b0ca9cae3061c3f9dd244e7ddb1c664d50b3e99e` 复核 release、静态验证、最小运行时 smoke、核心文档与本地清理状态。

## Release Baseline

- `origin/main` commit：`b0ca9cae3061c3f9dd244e7ddb1c664d50b3e99e`
- tag：`v0.1.0-mvp`
- tag peeled target：`b0ca9cae3061c3f9dd244e7ddb1c664d50b3e99e`
- annotated tag object：`212de0921e32e052f4e6de0cf7226cb54eea9cd5`
- GitHub Release：<https://github.com/unnoderes/skilldock/releases/tag/v0.1.0-mvp>
- `gh release view v0.1.0-mvp`：可访问，`isDraft=false`，`isPrerelease=false`

## Validation Results

在干净 worktree `/tmp/skilldock-v010-verify`、`HEAD=b0ca9cae3061c3f9dd244e7ddb1c664d50b3e99e` 执行：

```bash
pnpm install
pnpm typecheck
pnpm build
```

结果：**全部通过**。

补充：GitHub Release 正文中的 Validation 段已反映复核结果：

- `pnpm typecheck`: pass
- `pnpm build`: pass
- baseline: `b0ca9cae3061c3f9dd244e7ddb1c664d50b3e99e`

## Runtime Smoke Results

本次仅执行最小只读 smoke，不执行默认破坏性写操作。

已验证：

- `GET /healthz`：pass
- `GET /api/status`：pass
- `GET /api/settings`：pass
- `GET /api/logs?limit=5`：pass

运行时观察：

- `skills --version` 返回 `1.5.3`
- `add-mcp --version` 返回 `1.8.0`
- `/api/settings` 返回安全偏好配置与只读 metadata
- `/api/logs` 正常返回最近 operation logs

说明：当前机器上已存在 `~/.skilldock/config.json` 与 `~/.skilldock/logs/operations.jsonl`，因此 smoke 返回的是**本机既有配置/日志状态**，未对 repo 内产品代码做额外修改。

## Docs Final Check

已检查：

- `README.md`
- `docs/05-dev-plan.md`
- `docs/11-runtime-smoke.md`
- `docs/12-mvp-release-readiness.md`

结论：核心启动命令、MVP caveats、Logs / Settings、release 文档入口均存在；本次仅新增本 final sync 文档，不需要改动产品或流程文档正文才能满足 MVP 收尾要求。

## Sensitive / Temp File Check

基于干净基线检查结果：

- 未发现被跟踪的 `.env`
- 未发现被跟踪的 `node_modules/` 或 `dist/`
- repo 内未发现嵌套 `.git/`
- release / runtime 文档中的 `token` / `secret` / `password` 仅为说明性文本，不是实际密钥

注意：`/api/logs` 返回的历史记录来自 `~/.skilldock/logs/operations.jsonl`，属于本机本地状态，不应提交到仓库。

## Local Cleanup Status

本地 `/home/unnode/skilldock` 的 `main` 不是干净基线，当前状态为：

- `main...origin/main [ahead 2, behind 13]`
- 已修改：`AGENTS.md`、`docs/05-dev-plan.md`、`docs/06-agent-orchestration.md`、`docs/07-workflow-triggers.md`
- 已删除：`docs/启动前准备工作.md`
- 未跟踪：`.agents/`、`.codex`、`SKILL.md`、`docs/agent-task-prompts/`、`docs/order/`、`docs/undone-development-plan/`、`docs/workflow-prompt/`、`skilldock/`

分类建议：

- `.agents/`、`.codex`、`docs/agent-task-prompts/`、`docs/order/`、`docs/undone-development-plan/`、`docs/workflow-prompt/`、`SKILL.md`：更像 PM / agent 规划产物，应先归档或单独整理。
- `skilldock/`：疑似误生成的嵌套目录，应人工确认是否需要保留。
- `docs/启动前准备工作.md` 删除与若干 docs 修改：需人工确认是否为真实文档编辑。

**本次未执行任何 destructive cleanup。** 如需回到干净主线，建议先人工备份后再执行下列命令：

```bash
git -C /home/unnode/skilldock switch main
git -C /home/unnode/skilldock stash push --include-untracked -m "pre-mvp-final-cleanup"
git -C /home/unnode/skilldock fetch origin --prune --tags
git -C /home/unnode/skilldock reset --hard origin/main
git -C /home/unnode/skilldock clean -fd
```

> 仅在确认本地未提交产物都可安全暂存/丢弃时再执行。

## Remaining Caveats

1. task active state 仅保存在 server 进程内；server 重启后旧 `taskId` 不保证可查询。
2. `add-mcp` 远程安装成功主要表示配置写入成功，不代表远端服务一定可连通。
3. `add-mcp` 输出仍以原始 CLI 文本展示为主，不做复杂解析；这仍属于 MVP 范围内已接受限制。
4. 本地主仓库 `main` 仍存在待人工处理的脏状态与 agent 产物，不建议直接在该目录继续做 release 级验证。

## Next Backlog Suggestions

1. 为 task 状态提供持久化或重启后恢复策略。
2. 为 logs / settings 增加更明确的本地状态来源提示，减少 smoke 与真实用户配置相互影响。
3. 为 release 收尾建立固定 clean-worktree 脚本，避免在脏 `main` 上复核。
4. 在不突破产品边界前提下，补充更多只读 smoke 自动化。

## User Action Still Required

- 决定是否归档/清理本地 `main` 中的 agent 规划产物与嵌套目录。
- 如需保持仓库整洁，按上方建议命令在人工确认后执行清理。
- 审阅并合并本次 final sync 文档 PR。
