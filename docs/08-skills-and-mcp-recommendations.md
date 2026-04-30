# 08. Skills / MCP 推荐策略

## 推荐原则

- 只推荐能减少开发摩擦或提升代码生成质量的工具。
- 优先推荐本项目当前阶段马上有用的。
- 引入前先确认安装方式、权限、是否会改配置。
- MCP 涉及密钥时必须默认本地脱敏，不上传配置。

## 当前阶段建议 Skills

| 类型 | 建议 | 用途 |
| --- | --- | --- |
| 项目管理 | vibekanban | 任务拆分、代理编排、worktree 开发 |
| 代码审查 | pr-review / code-review 类 skill | 让 Reviewer Agent 有固定审查清单 |
| 前端实现 | react / frontend-design 类 skill | 生成简单一致的 UI |
| 后端实现 | typescript / node-api 类 skill | 约束 API 与类型设计 |

## 当前阶段建议 MCP Server

| MCP | 用途 | 当前优先级 |
| --- | --- | --- |
| filesystem | 受控读写项目文件 | 高 |
| git | 查看 diff/status/log | 高 |
| github | 后续 issue/PR 工作流 | 中 |
| sequential-thinking | 复杂任务拆解 | 中 |
| playwright | 后续 UI 自动验证 | 中 |

## 暂不建议

- 数据库 MCP：当前 MVP 不需要。
- 浏览器自动化 MCP：等 UI 稳定后再上。
- 云端密钥/配置同步类 MCP：当前产品边界不包含。

## 后续推荐触发条件

- 开始复杂 UI：推荐 Playwright MCP。
- 开始 PR 流程：推荐 GitHub MCP。
- 开始多代理并行：推荐 Vibe Kanban workspace/worktree 流程。
- 开始日志/安全审查：推荐 code-review/security-review skill。
