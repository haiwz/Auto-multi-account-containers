#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

source "$ROOT_DIR/scripts/load-release-env.sh"

VERSION="$(node -p "require('./package.json').version")"
TAG="v${VERSION}"
ZIP_PATH="artifacts/auto_multi-account_containers-${VERSION}.zip"
XPI_PATH="artifacts/auto_multi-account_containers-${VERSION}-signed.xpi"

for artifact in "$ZIP_PATH" "$XPI_PATH"; do
  if [[ ! -f "$artifact" ]]; then
    echo "Missing release artifact: $artifact" >&2
    exit 1
  fi
done

if [[ -z "${GH_TOKEN:-}" && -z "${GITHUB_TOKEN:-}" ]]; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "GitHub CLI is not authenticated. Set GH_TOKEN or run gh auth login." >&2
    exit 1
  fi
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "GitHub release already exists: $TAG" >&2
  exit 1
fi

gh release create "$TAG" "$ZIP_PATH" "$XPI_PATH" --verify-tag --generate-notes
