# Dedicated Hosting Add-on Playbook (PL-4.5)

## Objective
Provide isolated infrastructure for customers needing stricter security, custom domain, and stronger operational controls.

## Baseline Architecture
- Dedicated Supabase project per tenant
- Dedicated Vercel project/deployment per tenant
- Isolated environment variables and storage buckets
- Customer-specific domain + TLS

## Provisioning Steps
1. Create dedicated Supabase project (region per customer requirement)
2. Apply migrations from `db/migrations/*`
3. Configure buckets:
   - `permit_attachments`
   - `qualification_evidence`
4. Create dedicated Vercel project and attach repo
5. Set per-tenant env variables (`NEXT_PUBLIC_SUPABASE_URL`, keys, `CRON_SECRET`)
6. Configure DNS/custom domain
7. Smoke test auth, permit creation, reminders, PDF export

## Optional Enterprise Add-ons
- SSO/SAML
- Extended retention windows
- Customer-managed backup and key requirements
- Dedicated support SLA

## Commercial Notes
- Dedicated hosting is separate SKU from shared SaaS tiers
- Include setup fee + monthly minimum in quote template
