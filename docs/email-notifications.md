# Email Notifications

Provider: **Resend**

## Required environment variables
- `RESEND_API_KEY`
- `EMAIL_FROM` (e.g. `WorkPermitOS <noreply@yourdomain.com>`)
- `APP_BASE_URL` for links in notification emails

## Event triggers
1. Permit submitted
   - Trigger: status transition to `submitted`
   - Recipients: workspace `approver`, `admin`, `owner`

2. Permit approved
   - Trigger: approval action
   - Recipients: workspace `issuer`, `admin`, `owner`

3. Qualification digest
   - Trigger: `POST /api/jobs/reminders/digest`
   - Recipients: workspace `owner`, `admin`
   - Logs: `reminder_deliveries.send_status` + payload metadata

## Failure behavior
- If provider is not configured, send attempts return `email_not_configured`.
- Reminder digest writes failed status to delivery logs for visibility.
