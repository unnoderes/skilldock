# 02. Architecture And Data Model

## 架构形态

```txt
Frontend Project Selector
  ↓ projectId
Local API Gateway
  ↓ resolveProjectContext(projectId)
Command Orchestrator
  ↓ execa("npx", args, { cwd: project.path })
npx skills / npx add-mcp
```

## 存储位置

MVP 使用本地 JSON 文件：

```txt
~/.skilldock/
  config.json
  projects.json
  logs/
```

`projects.json` 只保存项目 registry，不保存密钥。

## Shared Types 草案

```ts
export type ProjectStatus = "valid" | "missing" | "not-directory" | "inaccessible";

export type ProjectRecord = {
  id: string;
  name: string;
  path: string;
  status: ProjectStatus;
  isLaunchProject: boolean;
  addedAt: string;
  lastUsedAt: string;
  lastValidatedAt: string;
};

export type ProjectsResponse = {
  projects: ProjectRecord[];
  activeProjectId: string;
  launchProjectId: string;
};

export type ProjectAddRequest = {
  path: string;
  makeActive?: boolean;
};

export type ProjectSetActiveRequest = {
  projectId: string;
};

export type ProjectContext = {
  projectId: string;
  projectName: string;
  projectPath: string;
};
```

## Project ID

推荐使用稳定 hash：

```txt
sha256(realpath).slice(0, 16)
```

理由：

- 同一路径不会重复注册。
- 不需要额外映射。
- 避免直接在 API URL 中使用完整 path。

如果未来需要支持同一路径不同配置，可改为 UUID；MVP 先用 path hash 足够。

## Launch Project

server 启动时记录：

```ts
const LAUNCH_PROJECT_PATH = process.cwd();
```

启动目录自动注册为 `isLaunchProject: true`，并作为默认 active project。

## Active Project

active project 可以存在 `config.json`：

```ts
type SkillDockConfig = {
  defaultSkillsScope: Scope;
  defaultMcpScope: Scope;
  defaultLogsLimit: number;
  collapseRawOutput: boolean;
  activeProjectId?: string;
};
```

如果 `activeProjectId` 缺失或无效，fallback 到 launch project。

## Project Validation

保存项目之前，server 必须执行：

1. `path.isAbsolute(inputPath)`
2. `realpath(inputPath)`
3. `stat(realPath)`
4. `stat.isDirectory()`
5. `access(realPath)`

可选项目特征检测：

```txt
package.json
.git/
AGENTS.md
.codex/
pnpm-workspace.yaml
```

MVP 不强制必须存在项目特征。否则会误伤非 Node 项目。

## CLI CWD 解析

新增 helper：

```ts
async function resolveProjectContext(projectId?: string): Promise<ProjectContext>
```

project-scope CLI：

```ts
await execa("npx", args, {
  cwd: projectContext.projectPath,
  reject: false,
  stripFinalNewline: false,
});
```

global-scope CLI：

- 仍可使用 active project cwd，保证 `npx` 行为与用户当前上下文一致。
- 但 CLI args 需要显式传 `--global`。
- UI 必须说明 Global 是全局安装，不属于 active project。

## Task Metadata

`TaskRecord` 建议新增：

```ts
project?: ProjectContext;
scope?: Scope;
```

task 创建时就冻结 project context。用户后续切换 active project 不影响已启动 task。

## Operation Log Metadata

`OperationLogEntry` 建议新增：

```ts
project?: ProjectContext;
scope?: Scope;
```

日志用于回答：

```txt
这条命令作用于哪个项目？
```

## Backward Compatibility

现有 API 可以先兼容：

- 如果没有传 `projectId`，server 使用 active project。
- 老 UI 不会立刻坏。
- 新 UI 应尽量显式传 `projectId`，避免 active project 变更造成歧义。

## 风险

- 路径权限变化：项目被删除或权限改变后，需要显示 invalid 状态。
- 并发切换：task 必须冻结启动时 project context。
- registry 文件损坏：读取失败时 fallback launch project，并标记 `configStatus` 或记录 server warning。
- path 泄露：日志和 UI 会展示本地路径，这是本地工具可接受，但不能上传。

