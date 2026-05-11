# 04. Frontend Workflows

## 全局入口

Project Selector 建议放在 Sidebar 顶部，SkillDock 标识下方、CLI 状态上方或附近。

原因：

- project context 是全局上下文。
- Skills / MCP 都受它影响。
- 用户切换页面时仍能看到当前项目。

## Project Selector 默认形态

```txt
Project
SkillDock
/home/unnode/skilldock
```

交互：

- 点击打开 popover / dialog。
- 展示 active project。
- 展示 recent projects。
- 提供 Add Project。

## Selector Menu 草案

```txt
Current Project
  SkillDock
  /home/unnode/skilldock

Recent Projects
  project-a
  /home/user/project-a

  project-b
  /home/user/project-b

Actions
  Add local project
```

每个项目行：

- name
- compact path
- status badge：valid / missing / inaccessible
- last used
- select action
- remove action，launch project 禁止 remove

## Add Project Flow

MVP 使用手动路径输入：

```txt
Add Local Project

Project path
[/home/user/my-project             ]

[Validate & Add]
```

成功后：

- 添加到 registry。
- 默认设为 active project。
- 关闭 modal。
- invalidate `["projects"]`、`["skills"]`、`["mcp"]`。

失败后：

- 显示简短错误。
- 不展示 stack trace。
- 不执行任何 CLI。

## Skills 页面行为

Header 展示：

```txt
Scope: Project / Global
Current project: project-a
Search installed skills
Add Skill
```

规则：

- scope=Project：查询 active project。
- scope=Global：显示全局 Skills，但仍可以在页面上保留 active project context 说明。
- install/remove/update 的确认弹窗必须展示：

```txt
Project: /home/user/project-a
Scope: project
```

这样写操作目标不会含糊。

## MCP 页面行为

Header 展示：

```txt
Scope: Project / Global
Current project: project-a
Add MCP Server
```

规则：

- scope=Project：查询 active project 的 MCP config。
- scope=Global：查询 global MCP config。
- add confirmation 必须展示 project context。

## Task Drawer

Task Drawer 增加 project metadata：

```txt
Project
project-a
/home/user/project-a
```

注意：

- task 使用启动时 project context。
- 用户切换 active project 后，已运行 task 不变。

## Logs 页面

日志 summary 可以显示 project name 或 compact path：

```txt
POST /api/skills/install
project-a · npx skills add ...
```

详情区显示：

```txt
Project
Name: project-a
Path: /home/user/project-a
Scope: project
```

搜索建议支持 project name/path，但不是第一阶段硬要求。

## Settings 页面

可以新增只读 metadata：

```txt
Projects registry
~/.skilldock/projects.json
```

但不应在 Settings 中编辑项目路径。项目管理入口仍在 Project Selector。

## Invalid Project UX

如果项目路径失效：

```txt
project-a
/home/user/project-a
Missing
```

用户可以：

- remove from recent
- keep in list
- revalidate

禁止：

- 对 invalid project 执行 project-scope install/remove/update/add MCP。

## 移动端

- Sidebar 固定宽度的现状可能限制移动体验。
- MVP 可先保证 Project Selector 自身不溢出。
- 后续如做 mobile shell，再统一处理 Sidebar。

