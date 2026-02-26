#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[release] starting release checks"
./scripts/check-migrations.sh
./scripts/preflight.sh

echo "[release] release gate passed"
