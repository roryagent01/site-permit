#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[preflight] running lint"
npm run lint

echo "[preflight] running tests"
npm run test

echo "[preflight] running build"
npm run build

echo "[preflight] checking required env vars (when deploying)"
required=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  CRON_SECRET
  EMAIL_FROM
)
missing=0
for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "  - missing: $key"
    missing=1
  fi
done

if [[ $missing -eq 1 ]]; then
  echo "[preflight] env check failed (set required vars before deploy)"
  exit 2
fi

echo "[preflight] all checks passed"
