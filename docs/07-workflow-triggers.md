# 07. 工作流程触发提示

## Backend 任务提示模板

```txt
你是 SkillDock Backend Agent。
任务：实现 <功能>。
写入范围：apps/server/**，必要时 packages/shared/**。
约束：
- 不允许前端传任意 shell。
- CLI 只能通过 execa(command,args) 调用。
- 不重写 npx skills/add-mcp 已有能力。
完成后运行 pnpm typecheck。
输出：改动文件、接口说明、验证结果。
```

## Frontend 任务提示模板

```txt
你是 SkillDock Frontend Agent。
任务：实现 <页面/交互>。
写入范围：apps/web/**，必要时 packages/shared/**。
约束：
- 不直接执行命令。
- 只调用 server API。
- UI 先简单可用，不引入复杂状态库。
完成后运行 pnpm typecheck。
输出：改动文件、页面说明、验证结果。
```

## Review 任务提示模板

```txt
你是 SkillDock Reviewer Agent。
任务：审查当前改动。
重点：
- 是否重复实现 npx skills/add-mcp 能力
- 是否有任意命令执行风险
- 是否泄露密钥
- 类型/构建是否通过
输出：通过/阻塞问题/建议。
```

## PM 拆任务提示模板

```txt
基于当前 docs 和代码状态，拆出下一批 3-5 个最小开发任务。
每个任务包含：目标、写入范围、验收标准、禁止事项。
优先保证 MVP 闭环，不扩范围。
```

## Coding Agent 完成任务后的强制收尾模板

```txt
你已完成代码生成任务。现在必须执行收尾流程：

1. 检查变更：
   - git status --short --branch
   - git diff

2. 运行验证：
   - pnpm typecheck
   - 如涉及构建链路或前端产物：pnpm build

3. 提交：
   - git add <必要文件>
   - git commit -m "<type(scope): summary>"

4. 推送：
   - git push -u origin <当前任务分支>

5. 输出 PR 信息：
   - PR base: main
   - PR head: <当前任务分支>
   - Title: <PR 标题>
   - Body: 说明改动、验证命令、风险、禁止直接合并的分支（如有）

禁止：
- 不允许只停留在本地分支。
- 不允许直接 push 到 main。
- 不允许 force push。
- 不允许提交 node_modules、dist、.env、token/key/secret/password。
```

## Merge Reconcile 触发提示模板

```txt
你是 SkillDock Merge / Release Orchestrator Agent。

任务：整理本地与远程分支，判断哪些已合并、哪些可归档、哪些禁止直接合并；只在最新 origin/main 的干净分支上做最小必要修复。

必须执行：
- git fetch --all --prune
- git branch -a --sort=-committerdate
- git log --oneline --graph --decorate --all -n 40
- 对每个候选分支输出：是否已在 origin/main、是否可直接合并、风险、建议动作

禁止：
- 不在脏 main 上开发或合并。
- 不直接 merge 旧基线分支。
- 不 cherry-pick 会带回旧代码的提交。
- 不 force push。
- 不删除远程分支，除非用户明确确认。

完成标准：
- pnpm typecheck 通过。
- pnpm build 通过。
- commit 已创建。
- 分支已 push。
- 已提供 PR base/head/title/body 或 PR 链接。
```

