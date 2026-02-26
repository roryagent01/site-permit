# Delivery & Change Management (DS-15.E)

## Environment promotion
- dev -> staging -> prod
- run `lint`, `test`, `build` at each promotion gate

## Migration safety
- apply migrations in order
- run smoke queries before app deploy
- keep rollback SQL notes for destructive changes
- use migration preflight runbook: `docs/production/migration-runbook.md`

## Local release gates (implemented)
- `./scripts/check-migrations.sh`
- `./scripts/preflight.sh`
- `./scripts/release.sh`

## CI checks
- Intended: required checks on PR before merge
- Current blocker: GitHub token missing workflow scope for pushing CI workflow updates
- Temporary control: manual `scripts/release.sh` required before deployment
