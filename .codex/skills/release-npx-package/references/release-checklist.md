# Release Checklist

- Fetch latest remote refs.
- Confirm current worktree state.
- Create a clean worktree from `origin/main` if local changes exist.
- Confirm `package.json` has `name`, `version`, and `bin`.
- Check npm registry latest version.
- Bump to a never-published version.
- Run install, typecheck, build, pack dry-run, pack.
- Smoke test the tarball with `npx`.
- Commit only version/package changes.
- Push release branch and create PR.
- Wait for CI and merge.
- Publish only after explicit user approval.
- Verify `npm view <name> version`.
- Verify `npx --yes <name>@latest --version`.
- Delete temp npmrc files and avoid committing `.tgz`.
