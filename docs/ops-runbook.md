# Operations Runbook (Shared SaaS)

## 1) Environment + Deploy Checklist (DS-12.B)

### 1.1 Configure environment
Set these in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `PERMIT_ATTACHMENTS_BUCKET=permit_attachments`
- `QUALIFICATION_EVIDENCE_BUCKET=qualification_evidence`

### 1.2 Apply database migrations
Run in order on the target Supabase Postgres:
- `db/migrations/0001_init_core_schema.sql`
- `0002_rls_policies.sql`
- `0003_membership_bootstrap_policies.sql`
- `0004_templates_files_usage.sql`
- `0005_reminder_delivery_controls.sql`
- `0006_workspace_billing_fields.sql`
- `0007_permit_rejection_fields.sql`
- `0008_additional_indexes.sql`

### 1.3 Create storage buckets
In Supabase Storage create buckets:
- `permit_attachments`
- `qualification_evidence`

### 1.4 Enable realtime for key tables
Enable replication/realtime on:
- `permits`
- `permit_approvals`
- (optional) `reminder_deliveries`

### 1.5 Deploy app
- Push to `main`
- Confirm Vercel production deploy passes
- Smoke test login and `/app/dashboard`

---

## 2) Scheduled Jobs

### 2.1 Daily reminder digest job
Trigger endpoint:
- `POST /api/jobs/reminders/digest`
- Header: `x-cron-secret: $CRON_SECRET`

Behavior:
- Computes expiring qualifications by workspace windows
- Writes idempotent delivery logs by `delivery_key`
- Applies backpressure mode (`full` vs `summary`) when counts exceed cap
- Attempts email delivery and logs `send_status`

### 2.2 Permit auto-activation job
Trigger endpoint:
- `POST /api/jobs/permits/activate`
- Header: `x-cron-secret: $CRON_SECRET`

Behavior:
- Finds `approved` permits with `start_at <= now`
- Moves them to `active`

### 2.3 Recommended OpenClaw cron examples
```bash
# Reminder digest
openclaw cron add \
  --name "site-permit-reminder-digest-daily" \
  --cron "0 7 * * *" \
  --tz "Europe/Dublin" \
  --session isolated \
  --message "POST https://<app-domain>/api/jobs/reminders/digest with x-cron-secret"

# Permit auto-activation every 5 minutes
openclaw cron add \
  --name "site-permit-activate-approved" \
  --every 5m \
  --session isolated \
  --message "POST https://<app-domain>/api/jobs/permits/activate with x-cron-secret"
```

---

## 3) Health checks
- Build and typecheck on every release candidate:
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- API smoke checks:
  - `/api/jobs/reminders/digest` with cron header
  - `/api/jobs/permits/activate` with cron header

---

## 4) Incident basics

If reminder digests fail, verify:
- `CRON_SECRET` matches scheduler header
- DB migration `0005_reminder_delivery_controls.sql` applied
- `reminder_settings.digest_enabled` for workspace
- `RESEND_API_KEY` + `EMAIL_FROM` are configured

If permit activation fails, verify:
- `start_at` values are populated and in UTC-compatible format
- `status='approved'` permits exist
- migration set includes permit lifecycle timestamps
