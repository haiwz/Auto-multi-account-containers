#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CHANNEL="${1:-}"
if [[ "$CHANNEL" != "listed" && "$CHANNEL" != "unlisted" ]]; then
  echo "Usage: ./scripts/sign-addon.sh <listed|unlisted>" >&2
  exit 1
fi

source "$ROOT_DIR/scripts/load-release-env.sh"

if [[ -z "${WEB_EXT_API_KEY:-}" || -z "${WEB_EXT_API_SECRET:-}" ]]; then
  echo "Missing AMO credentials. Set WEB_EXT_API_KEY and WEB_EXT_API_SECRET in .release-secrets.local or the shell environment." >&2
  exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
STABLE_XPI_PATH="artifacts/auto_multi-account_containers-${VERSION}-signed.xpi"

SIGN_ARGS=(sign "--channel=${CHANNEL}")
if [[ "$CHANNEL" == "listed" ]]; then
  SIGN_ARGS+=("--amo-metadata=amo/metadata-listed.json")
fi

web-ext "${SIGN_ARGS[@]}"

LATEST_SIGNED_XPI="$(ls -t artifacts/*-"${VERSION}".xpi 2>/dev/null | grep -v -- '-signed\.xpi$' | head -n 1 || true)"
if [[ -z "$LATEST_SIGNED_XPI" ]]; then
  echo "Signed XPI not found in artifacts/ after signing." >&2
  exit 1
fi

cp "$LATEST_SIGNED_XPI" "$STABLE_XPI_PATH"
echo "Stable signed XPI copied to $STABLE_XPI_PATH"
