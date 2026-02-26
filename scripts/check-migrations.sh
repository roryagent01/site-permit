#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[migrations] validating file ordering and naming"
mapfile -t files < <(find db/migrations -maxdepth 1 -type f -name '*.sql' | sort)

if [[ ${#files[@]} -eq 0 ]]; then
  echo "No migration files found"
  exit 1
fi

prev=0
for f in "${files[@]}"; do
  base="$(basename "$f")"
  prefix="${base%%_*}"
  if ! [[ "$prefix" =~ ^[0-9]{4}$ ]]; then
    echo "Invalid migration prefix: $base"
    exit 1
  fi
  num=$((10#$prefix))
  if (( num <= prev )); then
    echo "Migration order issue: $base"
    exit 1
  fi
  prev=$num
done

echo "[migrations] ok"
