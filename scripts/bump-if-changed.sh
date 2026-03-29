#!/usr/bin/env bash
# Auto-bump prerelease versions for cli and shared if their source files changed.
# Intended to run as a pre-push hook or manually before pushing.

set -euo pipefail

REMOTE="${1:-origin}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Get the range of commits being pushed
LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse "$REMOTE/$BRANCH" 2>/dev/null || echo "0000000000000000000000000000000000000000")

if [ "$REMOTE_SHA" = "0000000000000000000000000000000000000000" ]; then
  # New branch — check all commits
  CHANGED_FILES=$(git diff --name-only --diff-filter=ACMR HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD)
else
  CHANGED_FILES=$(git diff --name-only "$REMOTE_SHA" "$LOCAL_SHA")
fi

BUMPED=false

# Check if cli source changed
if echo "$CHANGED_FILES" | grep -q "^packages/cli/"; then
  echo "📦 packages/cli/ changed — bumping version"
  cd packages/cli
  npm version prerelease --preid=alpha --no-git-tag-version --no-commit-hooks
  cd ../..
  BUMPED=true
fi

# Check if shared source changed
if echo "$CHANGED_FILES" | grep -q "^packages/shared/"; then
  echo "📦 packages/shared/ changed — bumping version"
  cd packages/shared
  npm version prerelease --preid=alpha --no-git-tag-version --no-commit-hooks
  cd ../..
  BUMPED=true
fi

if [ "$BUMPED" = true ]; then
  git add packages/cli/package.json packages/shared/package.json 2>/dev/null || true
  git commit --amend --no-edit --no-verify
  echo "✓ Versions bumped and commit amended"
fi
