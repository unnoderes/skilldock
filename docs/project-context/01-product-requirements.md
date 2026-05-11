# 01. Product Requirements

## 背景

当前 SkillDock 的 `Project` scope 指的是 server 启动目录，例如：

```txt
/home/unnode/skilldock
```

用户无法在 UI 中切换到另一个本地项目，也无法查看“项目 A / 项目 B / 当前项目”各自安装了哪些 Skills 或 MCP Server。

## 目标

新增 Project Context 能力：

- 展示当前 active project。
- 支持注册本地项目目录。
- 支持在最近项目之间切换。
- 支持手动添加项目路径。
- `Project` scope 下的 Skills / MCP 查询与写操作作用于 active project。
- Task 与 Logs 能记录操作发生在哪个 project context 中。

## 用户故事

1. 用户打开 SkillDock，默认项目是 SkillDock 的启动目录。
2. 用户在 Project Selector 中看到当前项目路径。
3. 用户添加 `/home/user/project-a`。
4. 用户切换到 `project-a`。
5. 用户进入 Skills 页，`Project` scope 显示 `project-a` 的 installed skills。
6. 用户安装一个 Skill，该安装发生在 `project-a`。
7. 用户进入 Logs 页，可以看出这次操作属于 `project-a`。

## MVP 范围

- 项目注册表：保存本地项目路径和最近使用时间。
- 当前 active project：server 保存和暴露。
- 手动输入项目路径并由 server 校验。
- Project Selector：展示 active project、recent projects、add project。
- Skills project-scope 查询和写操作支持 project context。
- MCP project-scope 查询和写操作支持 project context。
- Task / Logs 带 project metadata。

## 暂不做

- 文件系统浏览器。
- 扫描全磁盘发现项目。
- 云同步项目列表。
- 团队项目共享。
- 任意远程项目。
- 自动 clone repo。
- 自建 workspace indexer。
- 复杂权限模型。

## 命名

推荐使用：

```txt
Project Context
```

不建议使用：

```txt
Project Filter
```

原因：这个能力不只是过滤 UI 列表，而是决定 project-scope CLI 命令的 `cwd`。

## 安全要求

- 前端只能新增项目路径到集中 API：`POST /api/projects`。
- 其他 CLI API 不接受 raw path。
- CLI API 只接受 `projectId`。
- server 根据 `projectId` 查出已注册、已校验的 canonical path。
- 所有 path 在保存前必须经过 `realpath` 规范化。
- 不允许相对路径。
- 不允许不存在的路径。
- 不允许非目录路径。
- 不允许把项目路径拼进 shell 字符串。

## 体验要求

- 当前项目必须在全局 UI 中可见。
- 切换项目后 Skills / MCP 自动刷新。
- Global scope 行为不受 active project 影响，但日志仍可记录触发时的 active project。
- 项目路径失效时，UI 明确展示 invalid 状态，并阻止 project-scope 写操作。
- 空项目列表时，仍保留 launch project 作为默认项目。

