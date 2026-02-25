# Site Permit (WorkPermitOS)

WorkPermitOS is a multi-tenant Permit-to-Work and Contractor Qualification SaaS for SMBs.

## Stack
- Next.js (App Router)
- Supabase (Auth, Postgres, Storage, Realtime)
- TypeScript
- Tailwind + shadcn/ui-style component system

## Current Status
Initial repository scaffold created from the Design Spec v0.9.

## Key Docs
- `docs/design-spec.md` (authoritative DS spec)
- `plan.md` (implementation plan mapped 1:1 to DS IDs)
- `db/migrations/*` (schema + RLS baseline)

## Phases
- Phase 0: Foundations (auth, tenant model, app shell)
- Phase 1: Permits MVP
- Phase 2: Contractor Qualifications
- Phase 3: Packaging/Limits/Audit/Test gates
