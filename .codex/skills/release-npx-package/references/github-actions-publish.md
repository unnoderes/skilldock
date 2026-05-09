# GitHub Actions npm Publish Template

Use this workflow for npm packages that publish from GitHub Actions using an `NPM_TOKEN` repository secret.

```yaml
name: Publish to npm

on:
  workflow_dispatch:
  release:
    types:
      - published

permissions:
  contents: read

concurrency:
  group: publish-npm
  cancel-in-progress: false

jobs:
  publish:
    name: Publish package
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.33.2
          run_install: false

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Build
        run: pnpm build

      - name: Check registry version
        id: package
        shell: bash
        run: |
          name="$(node -p "require('./package.json').name")"
          version="$(node -p "require('./package.json').version")"
          published="$(npm view "$name@$version" version 2>/dev/null || true)"
          echo "name=$name" >> "$GITHUB_OUTPUT"
          echo "version=$version" >> "$GITHUB_OUTPUT"
          if [ "$published" = "$version" ]; then
            echo "already_published=true" >> "$GITHUB_OUTPUT"
            echo "$name@$version is already published; skipping npm publish."
          else
            echo "already_published=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Publish to npm
        if: steps.package.outputs.already_published != 'true'
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Verify published version
        if: steps.package.outputs.already_published != 'true'
        run: |
          published="$(npm view "${{ steps.package.outputs.name }}" version)"
          test "$published" = "${{ steps.package.outputs.version }}"
```

Adapt `pnpm` and `node-version` to the repo. Keep the registry version guard.
