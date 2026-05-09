---
name: release-npx-package
description: Use when preparing a new release for a GitHub-hosted npm/npx package, bumping package versions, creating release PRs, publishing to the official npm registry, configuring npm publish workflows, or verifying npm latest/npx behavior after release.
---

# Release npx Package

Use this skill to make a release for an npm package that exposes a `package.json#bin` command and is expected to run with `npx`.

This skill coordinates the repo release workflow. For npm-specific packaging and auth rules, also use `npm-npx-publisher` when available.

## Hard Rules

- Do not publish to npm unless the user explicitly asks to publish or sync to npm.
- Never commit npm tokens, `.npmrc`, generated `.tgz` files, logs, or local env files.
- Work from a clean task/release branch based on latest `origin/main`; if the active worktree is dirty, create a temporary worktree.
- Do not reuse an already published npm version. Bump `package.json#version` first.
- Before publishing, require `npm whoami` or `NPM_TOKEN` auth to succeed.
- If publish fails due to 2FA, ask for OTP or a granular npm token with 2FA bypass.
- After publish, verify both registry metadata and `npx <package>@latest --version`.

## Standard Workflow

1. Inspect repo state:
   ```bash
   git fetch origin
   git status --short --branch
   npm view <package> version dist-tags.latest --json
   ```

2. Create a clean release worktree if needed:
   ```bash
   tmpdir="$(mktemp -d /tmp/<package>-release.XXXXXX)"
   rmdir "$tmpdir"
   git worktree add -b release/<version> "$tmpdir" origin/main
   ```

3. Run preflight from the package root:
   ```bash
   node /home/unnode/.codex/skills/release-npx-package/scripts/release-preflight.mjs --target-version <version>
   ```

4. Bump version without tagging:
   ```bash
   npm version <version> --no-git-tag-version
   ```

5. Validate:
   ```bash
   pnpm install --frozen-lockfile
   pnpm typecheck
   pnpm build
   npm pack --dry-run
   npm pack
   npx ./<package>-<version>.tgz --help
   timeout 8s npx ./<package>-<version>.tgz --port <safe-port>
   ```

   Adapt commands to the repo's package manager and scripts. For non-server CLIs, use a safe command such as `--version`.

6. Commit and open a release PR:
   ```bash
   git add package.json
   git add package-lock.json pnpm-lock.yaml yarn.lock 2>/dev/null || true
   git diff --cached --check
   git diff --cached --stat
   git commit -m "chore: release <version>"
   git push -u origin HEAD
   gh pr create --base main --head release/<version> --title "chore: release <version>" --body "<checks>"
   ```

7. After the release PR is merged, publish only if explicitly requested:
   ```bash
   git fetch origin
   npm publish --access public
   npm view <package> version
   npx --yes <package>@latest --version
   ```

## npm Token Handling

Prefer repository or environment secrets for CI. For local one-off publish with a token, use a temporary npmrc:

```bash
tmp_npmrc="$(mktemp /tmp/npmrc.XXXXXX)"
chmod 600 "$tmp_npmrc"
printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$tmp_npmrc"
NPM_CONFIG_USERCONFIG="$tmp_npmrc" npm publish --access public
rm -f "$tmp_npmrc"
```

Never echo the token. Never write it to the repo.

## GitHub Actions Publish Workflow

If the user asks to automate npm publishing in GitHub Actions:

- Store npm auth as repository secret `NPM_TOKEN`.
- Use a separate workflow from CI.
- Trigger with `workflow_dispatch` and optionally `release: published`.
- Run install, typecheck, build, registry version check, `npm publish`, and post-publish verification.
- Add a guard that skips publish when `name@version` already exists on npm.

Use `references/github-actions-publish.md` for the workflow template.

## Final Report

Always report:

- package name and version
- branch and PR URL, if created
- validation commands and results
- publish status
- registry version and `npx @latest` verification
- any leftover local artifacts, such as a generated `.tgz`, if not deleted
