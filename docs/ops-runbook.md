# Operations Runbook (Shared SaaS)

## Daily reminder digest job
Trigger endpoint:
- `POST /api/jobs/reminders/digest`
- Header: `x-cron-secret: $CRON_SECRET`

Behavior:
- Computes expiring qualifications by workspace windows
- Writes idempotent delivery logs by `delivery_key`
- Applies backpressure mode (`full` vs `summary`) when counts exceed cap

## Recommended OpenClaw cron example
```bash
openclaw cron add \
  --name "site-permit-reminder-digest-daily" \
  --cron "0 7 * * *" \
  --tz "Europe/Dublin" \
  --delete-after-run false \
  --session isolated \
  --message "POST https://<app-domain>/api/jobs/reminders/digest with x-cron-secret"
```

## Health checks
- Build and typecheck on every release candidate:
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## Incident basics
- If reminders fail, verify:
  - `CRON_SECRET` matches scheduler header
  - DB migration `0005_reminder_delivery_controls.sql` applied
  - `reminder_settings.digest_enabled` for workspace
