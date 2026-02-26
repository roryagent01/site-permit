# Delivery & Change Management (DS-15.E)

## Environment promotion
- dev -> staging -> prod
- run `lint`, `test`, `build` at each promotion gate

## Migration safety
- apply migrations in order
- run smoke queries before app deploy
- keep rollback SQL notes for destructive changes

## CI checks
- Intended: required checks on PR before merge
- Current blocker: GitHub token missing workflow scope for pushing CI workflow updates
