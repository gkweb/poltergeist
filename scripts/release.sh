#!/usr/bin/env bash
set -euo pipefail

BUMP="${1:-patch}"

pnpm --filter @poltergeist-ai/cli exec npm version "$BUMP" --no-git-tag-version

VERSION=$(node -p "require('./packages/cli/package.json').version")

git add packages/cli/package.json
git commit -m "chore(cli): release v${VERSION}"
git tag "cli-v${VERSION}"

pnpm --filter @poltergeist-ai/cli publish --access public

echo "Published @poltergeist-ai/cli@${VERSION}"
