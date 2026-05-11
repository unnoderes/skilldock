# 03. API Contract

## 新增 Project APIs

### `GET /api/projects`

返回项目列表和当前 active project。

Response:

```ts
type ProjectsResponse = {
  projects: ProjectRecord[];
  activeProjectId: string;
  launchProjectId: string;
};
```

行为：

- server 启动目录必须始终存在于返回结果中。
- 每次请求可以轻量 revalidate，也可以只返回上次状态。
- MVP 建议在 `GET /api/projects` 时 revalidate，项目数量通常很小。

### `POST /api/projects`

添加本地项目路径。

Request:

```ts
type ProjectAddRequest = {
  path: string;
  makeActive?: boolean;
};
```

Response:

```ts
type ProjectsResponse
```

Validation:

- path 必须是绝对路径。
- path 必须存在。
- path 必须是目录。
- path 必须可访问。
- server 保存 canonical `realpath`。

Error examples:

```json
{ "error": "INVALID_PROJECT_PATH", "message": "project path must be absolute" }
{ "error": "PROJECT_NOT_FOUND", "message": "project path does not exist" }
{ "error": "PROJECT_NOT_DIRECTORY", "message": "project path is not a directory" }
{ "error": "PROJECT_INACCESSIBLE", "message": "project path is not accessible" }
```

### `PUT /api/projects/active`

切换 active project。

Request:

```ts
type ProjectSetActiveRequest = {
  projectId: string;
};
```

Response:

```ts
type ProjectsResponse
```

行为：

- projectId 必须存在于 registry。
- project 必须 valid，才能设为 active。
- 更新 `lastUsedAt`。

### `DELETE /api/projects/:id`

从 recent projects 移除项目。

行为：

- 不删除磁盘目录。
- 不删除任何 Skills / MCP 配置。
- launch project 不允许删除。
- 如果删除 active project，active fallback 到 launch project。

### `POST /api/projects/:id/validate`

可选。重新校验指定 project。

MVP 可以不做，直接让 `GET /api/projects` revalidate。

## 修改 Existing APIs

### Skills List

Current:

```txt
GET /api/skills/list?scope=project
GET /api/skills/list?scope=global
```

New:

```txt
GET /api/skills/list?scope=project&projectId=<id>
GET /api/skills/list?scope=global&projectId=<id>
```

规则：

- `scope=project`：server 用 projectId 解析 cwd，执行 `npx skills list --json`。
- `scope=global`：server 执行 `npx skills list --json --global`。
- 缺失 projectId 时 fallback active project。

### Skills Install

Request 增加：

```ts
type SkillsInstallRequest = {
  packageName: string;
  scope?: Scope;
  projectId?: string;
  agents?: string[];
  skillNames?: string[];
  copy?: boolean;
  all?: boolean;
  fullDepth?: boolean;
};
```

规则：

- `scope=project`：`cwd = project.path`，args 不加 `--global`。
- `scope=global`：args 加 `--global`。
- task 创建时记录 project context。

### Skills Remove / Update

同样增加 `projectId?: string`。

`update` 现有 `scope` 支持 `"project" | "global" | "auto"`：

- `project`：使用 project cwd，并加 `--project`。
- `global`：使用 active/project cwd，并加 `--global`。
- `auto`：使用 project cwd，不额外加 project/global flag。

### MCP List

Current:

```txt
GET /api/mcp/list?scope=project
GET /api/mcp/list?scope=global
```

New:

```txt
GET /api/mcp/list?scope=project&projectId=<id>
GET /api/mcp/list?scope=global&projectId=<id>
```

规则：

- `scope=project`：`cwd = project.path`，执行 `npx add-mcp list`。
- `scope=global`：执行 `npx add-mcp list --global`。

### MCP Add

Request 增加：

```ts
type McpAddRequest = {
  target: string;
  scope?: Scope;
  projectId?: string;
  agents?: string[];
  name?: string;
  transport?: "http" | "sse";
  headers?: string[];
  env?: string[];
  all?: boolean;
  gitignore?: boolean;
};
```

规则：

- `scope=project`：使用 project cwd。
- `scope=global`：加 `--global`。
- task 记录 project context。

## Error Handling

如果 projectId 无效：

```json
{ "error": "PROJECT_NOT_FOUND", "message": "project not found" }
```

如果 project 当前不可访问：

```json
{ "error": "PROJECT_INVALID", "message": "project path is no longer accessible" }
```

project-scope 写操作必须阻止 invalid project。

## Query Cache Keys

前端 query key 必须包含 projectId：

```ts
["projects"]
["skills", projectId, scope]
["mcp", projectId, scope]
["logs", limit]
```

否则切换项目后会复用旧缓存。

