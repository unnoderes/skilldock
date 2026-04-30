# 02. CLI 能力调研

检查日期：2026-04-30

## 版本

| CLI | 版本 |
| --- | --- |
| `npx skills` | 1.5.3 |
| `npx add-mcp` | 1.8.0 |

原始 help 输出已保存到：

```txt
docs/cli-help/
```

---

## `npx skills` 已确认能力

| 能力 | 是否支持 | 备注 |
| --- | --- | --- |
| 添加 Skill | 支持 | `skills add <package>` |
| 删除 Skill | 支持 | `skills remove [skills]` |
| 列出 Skill | 支持 | `skills list` / `skills ls` |
| 搜索 Skill | 支持 | `skills find [query]`，交互式 |
| 更新 Skill | 支持 | `skills update [skills...]` |
| 初始化 Skill | 支持 | `skills init [name]` |
| 从 lock 恢复 | 支持 | `skills experimental_install` |
| 同步 node_modules 到 agent 目录 | 支持 | `skills experimental_sync` |
| 全局 / 项目级作用域 | 支持 | `-g/--global`、默认 project |
| 指定 agent | 支持 | `-a/--agent <agents>` |
| 指定 skill | 支持 | `-s/--skill <skills>` |
| 非交互确认 | 支持 | `-y/--yes` |
| JSON 输出 | 部分支持 | `list/ls --json` 支持 |
| dry-run / plan | 未发现 | help 中未出现 |
| 自带备份 | 未发现 | help 中未出现 |

## 当前 `skills list` 探测结果

- project scope：空数组 `[]`
- global scope：已检测到若干全局 skills，例如 `vibekanban` 等

---

## `npx add-mcp` 已确认能力

| 能力 | 是否支持 | 备注 |
| --- | --- | --- |
| 添加 MCP Server | 支持 | `add-mcp [target]` |
| 远程 MCP | 支持 | target 可为 URL；`--transport http/sse` |
| 本地 stdio MCP | 支持 | target 可为 package name |
| 指定 agent | 支持 | `-a/--agent <agent>` |
| 全局 / 项目级作用域 | 支持 | `-g/--global`、默认 project |
| 指定 server name | 支持 | `-n/--name <name>` |
| HTTP header | 支持 | `--header 'Key: Value'`，可重复 |
| env | 支持 | `--env KEY=VALUE`，可重复 |
| 非交互确认 | 支持 | `-y/--yes` |
| 安装到所有 agents | 支持 | `--all` |
| list supported agents | 支持 | `add-mcp list-agents` |
| 查找 registry | 支持 | `add-mcp find [keyword]` |
| 列出已安装 MCP | 支持 | `add-mcp list` |
| 删除 MCP | 支持 | `add-mcp remove <query>` |
| 同步 MCP | 支持 | `add-mcp sync` / `unify` |
| JSON 输出 | 未发现 | `add-mcp list --json` 报 unknown option |
| dry-run / plan | 未发现 | help 中未出现 |
| 自带备份 | 未发现 | help 中未出现 |

## `add-mcp list-agents` 支持的 agents

已确认支持：

```txt
antigravity
cline
cline-cli
claude-code
claude-desktop
codex
cursor
gemini-cli
goose
github-copilot-cli
mcporter
opencode
vscode
zed
```

---

## 对 SkillDock MVP 的影响

1. `skills list --json` 可直接作为 Skills 列表数据源。
2. `add-mcp` 暂无 JSON 输出，MVP 阶段应优先展示原始输出，避免脆弱解析。
3. 两个 CLI 均未发现 dry-run / plan / 备份参数，写操作先做前端确认，备份能力后置或轻量实现。
4. 后端必须用白名单 API 映射 CLI 参数，不能允许前端传任意 shell 命令。
5. MVP 优先实现：`skills list`、`skills add`、`skills remove/update`、`add-mcp list-agents`、`add-mcp list`、`add-mcp add`。
