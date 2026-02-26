# Reliability & Recovery (DS-15.A)

## RPO/RTO targets
- Shared SaaS baseline:
  - RPO: 24h
  - RTO: 8h
- Dedicated hosting baseline:
  - RPO: 4h
  - RTO: 4h

## Backup verification
- Weekly restore drill on staging copy.
- Validate key tables: permits, approvals, contractors, training records.

## Notification retry + failure handling
- Email sending uses bounded retry (`sendEmailWithRetry`, max 3 attempts).
- Failures written to `notification_failures` for triage/replay.
