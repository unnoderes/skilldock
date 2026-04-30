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
