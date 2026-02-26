# Security Hardening Playbook (DS-15.B)

## Edge and abuse controls
- Enable Vercel WAF/bot protection where available.
- Keep API rate limits enabled in app routes.
- Monitor repeated 401/403/429 responses and investigate abuse patterns.

## Secret rotation
- Rotate `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and `RESEND_API_KEY` quarterly or on incident.
- Rotation steps:
  1. issue new secret in provider
  2. update Vercel env vars
  3. redeploy
  4. revoke old secret

## Access reviews
- Monthly review of workspace owner/admin memberships.
- Remove stale high-privilege access.

## Support least privilege
- Use temporary support access with expiry and audit logging.
