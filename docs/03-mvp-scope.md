# 03. MVP 范围

## MVP 目标

做出一个可用的本地图形化控制台，用来包装 `npx skills` 和 `npx add-mcp` 的核心操作。

## MVP 页面

- Overview：环境与状态总览
- Skills：Skills 列表与操作
- MCP：MCP Server 添加与结果展示
- Logs：命令执行日志
- Settings：CLI 路径与基础设置

## MVP 功能

- 调用 `npx skills` 获取环境 / Skills 信息
- 调用 `npx skills` 安装 Skill
- 调用 `npx skills` 删除 / 更新 Skill（如 CLI 支持）
- 调用 `npx add-mcp` 添加 MCP Server
- 显示命令 stdout / stderr / exit code
- 支持流式命令输出
- 记录操作历史
- 对日志中的密钥脱敏
- 写操作前提供确认

## MVP 暂不做

- 自建环境扫描器
- 自写 MCP 配置文件
- 自建 Skill registry
- 云同步
- 账号系统
- 团队协作
- 桌面打包
- 复杂备份恢复 UI

## 第一版成功标准

用户可以通过 GUI 完成：

```txt
查看环境/Skills → 安装 Skill → 添加 MCP Server → 查看执行日志
```
