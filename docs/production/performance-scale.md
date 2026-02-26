# Performance & Scale Validation (DS-15.F)

## Load-test targets
- Permit actions API
- Reminder digest job
- Training invite dispatch API

## Initial SLOs
- p95 permit action API < 500ms
- reminder digest end-to-end < 60s per 100 workspaces

## Capacity review cadence
- monthly query/index review
- monitor top slow queries from Supabase insights
