# Performance & Scale Validation (DS-15.F)

## Load-test targets
- Permit actions API
- Reminder digest job
- Training invite dispatch API

## Implemented load-test scripts
- `loadtests/permit-actions.js`
- `loadtests/reminder-digest.js`
- `loadtests/training-invites.js`

Run examples:
```bash
BASE_URL=https://your-app.vercel.app PERMIT_ID=<permit_uuid> k6 run loadtests/permit-actions.js
BASE_URL=https://your-app.vercel.app CRON_SECRET=<secret> k6 run loadtests/reminder-digest.js
BASE_URL=https://your-app.vercel.app CONTRACTOR_ID=<id> MODULE_ID=<id> k6 run loadtests/training-invites.js
```

NPM shortcuts:
- `npm run loadtest:permit`
- `npm run loadtest:reminders`
- `npm run loadtest:training`

## Initial SLOs
- p95 permit action API < 500ms
- reminder digest end-to-end < 60s per 100 workspaces

## Capacity review cadence
- monthly query/index review
- monitor top slow queries from Supabase insights
