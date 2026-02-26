# Migration Preflight & Rollback Runbook (DS-15.E)

## Preflight sequence
1. Ensure branch is green locally:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
2. Validate migration ordering:
   - `./scripts/check-migrations.sh`
3. Validate deploy preflight gate:
   - `./scripts/preflight.sh`
4. Run full release gate:
   - `./scripts/release.sh`

## Deployment sequence
1. Apply SQL migrations in order (`db/migrations/*.sql`)
2. Deploy app revision
3. Run smoke tests:
   - auth login
   - permit create/submit/approve
   - reminder job endpoint
   - training invite endpoint

## Rollback strategy
- Prefer forward-fix migration where possible.
- For destructive mistakes:
  - stop writes (maintenance mode)
  - restore latest verified backup snapshot
  - replay safe migrations
- Keep rollback notes in migration PR description.

## CI blocker note
- Full GitHub-required-check enforcement is pending token scope update (`workflow`).
- Until then, use `scripts/release.sh` as mandatory manual gate before merge/deploy.
