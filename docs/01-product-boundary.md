# 01. 产品边界

## 产品定位

SkillDock 是 `npx skills` 与 `npx add-mcp` 的本地图形化控制台。

它负责集中展示、执行、记录和安全管理 Skills / MCP 相关操作，不重新实现底层 CLI 已有能力。

## 做什么

- 提供本地 GUI / Web UI
- 调用 `npx skills` 管理 Skills
- 调用 `npx add-mcp` 添加 MCP Server
- 展示本地 agent / harness 环境状态
- 展示命令执行结果与日志
- 提供操作确认、错误提示、密钥脱敏
- 在必要时提供轻量备份 / 快照能力

## 不做什么

- 不重新实现环境扫描
- 不重新实现 Skill 安装 / 更新 / 删除逻辑
- 不重新实现 Skill registry
- 不重新实现 MCP 客户端配置写入逻辑
- 不维护另一套配置真相
- 不做 Agent 运行平台
- 不做云同步、账号系统、团队权限
- 不托管用户密钥

## 核心原则

```txt
CLI 已有能力：只包装，不重写。
CLI 没有能力：优先推动 CLI 暴露参数 / JSON / dry-run。
实在必要：才做最小补充。
```
