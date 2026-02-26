# WorkPermitOS Implementation Plan + DS Traceability

This file is the source of truth for delivery tracking.

## Rule (requested)
- Every **Design Spec item (DS-x.x)** must map to at least one **Plan item (PL-x.x)**.
- When a DS item is completed, the linked PL item must include:
  1. **What was built**
  2. **Where in code/docs/migrations**
  3. **Status** (`done`, `partial`, `todo`)

---

## DS → PL Master Traceability

| DS Item | Plan Item(s) | Status |
|---|---|---|
| DS-0 Product goals/scope | PL-0.2, PL-5.1 | done |
| DS-0.A release roadmap | PL-5.4 | done |
| DS-1.A visual design system | PL-0.2 | done |
| DS-1.B information architecture | PL-0.2 | done |
| DS-1.C interaction feedback | PL-1.2, PL-4.4 | done |
| DS-1.D responsive principles | PL-0.2 | done |
| DS-1.E UX standards | PL-4.4, PL-5.2 | done |
| DS-2.A OTP auth | PL-0.1 | done |
| DS-2.B tenant model | PL-0.1, PL-0.3 | done |
| DS-2.C RBAC baseline | PL-4.4 | done |
| DS-3.A templates | PL-1.1 | done |
| DS-3.B permit lifecycle | PL-1.2, PL-5.3 | done |
| DS-3.C approval workflow | PL-1.3, PL-5.3 | done |
| DS-3.D qualification gating | PL-4.1 | done |
| DS-3.E attachments | PL-2.3, PL-0.3 | done |
| DS-4.A contractors | PL-2.1 | done |
| DS-4.B qualification catalog | PL-2.2 | done |
| DS-4.C qualification instances | PL-2.3 | done |
| DS-4.D reminder engine | PL-2.4, PL-4.3 | done |
| DS-5.A pricing tiers | PL-3.2 | done |
| DS-5.B dedicated hosting addon | PL-4.5 | done |
| DS-5.C limit enforcement | PL-3.1 | done |
| DS-6.A core tables | PL-0.1 | done |
| DS-6.B RLS isolation | PL-0.1 | done |
| DS-6.C indexes/constraints | PL-0.1 | done |
| DS-7.A realtime | PL-1.4 | done |
| DS-7.B email notifications | PL-5.1 | done |
| DS-8.A PDF export | PL-1.5 | done |
| DS-8.B reports dashboard | PL-4.2 | done |
| DS-9.A audit events | PL-3.3 | done |
| DS-9.B compliance posture copy | PL-5.1 | done |
| DS-10.A secrets handling | PL-0.3 | done |
| DS-10.B hardening baseline | PL-5.2 | done |
| DS-11.A reminder job | PL-2.4 | done |
| DS-11.B backpressure | PL-4.3 | done |
| DS-12.A env contract | PL-0.3 | done |
| DS-12.B supabase setup checklist | PL-5.4 | done |
| DS-13.A automated tests | PL-3.4 | done |
| DS-13.B CI gates | PL-3.4 | done |
| DS-14.A ICP definition | PL-5.1 | done |
| DS-14.B success metrics | PL-5.1 | done |
| DS-15.A reliability/recovery | PL-6.1 | done |
| DS-15.B operational security hardening | PL-6.2 | done |
| DS-15.C observability/alerting | PL-6.3 | done |
| DS-15.D data lifecycle/governance | PL-6.4 | done |
| DS-15.E delivery/change management | PL-6.5 | done |
| DS-15.F performance/scale validation | PL-6.6 | done |
| DS-15.G enterprise readiness track | PL-6.7 | done |
| DS-16.A permit duplication + quick issue | PL-7.1 | done |
| DS-16.B permit calendar/timeline | PL-7.2 | done |
| DS-16.C contractor portal scoped access | PL-7.3 | done |
| DS-16.D qualification requirement packs | PL-7.4 | done |
| DS-16.E permit preconditions checklist | PL-7.5 | done |
| DS-16.F toolbox talk capture | PL-7.6 | done |
| DS-16.G needs-changes task tracking | PL-7.7 | done |
| DS-16.H smart reminder actions | PL-7.8 | done |
| DS-16.I expiring public share links | PL-7.9 | done |
| DS-16.J template versioning + rollback | PL-7.10 | done |
| DS-16.K site-level dashboards | PL-7.11 | done |
| DS-16.L mobile field UX optimization | PL-7.12 | done |
| DS-17.A API parity for core capabilities | PL-8.1 | done |
| DS-17.B machine-usable contracts | PL-8.2 | done |
| DS-17.C API security parity | PL-8.3 | done |
| DS-17.D agent integration documentation | PL-8.4 | done |
| DS-18.A internal employee onboarding invite links | PL-9.1 | done |
| DS-18.B contractor self-onboarding invite links | PL-9.2 | done |
| DS-18.C invite security and lifecycle | PL-9.3 | done |
| DS-18.D agent-operable onboarding APIs | PL-9.4 | done |
| DS-19.A training modules | PL-10.1 | done |
| DS-19.B bulk training dispatch | PL-10.2 | done |
| DS-19.C electronic completion before arrival | PL-10.3 | done |
| DS-19.D profile crediting | PL-10.4 | done |
| DS-19.E agent-operable training APIs | PL-10.5 | done |
| DS-20.A OCR ingestion | PL-11.1 | done |
| DS-20.B structured extraction output | PL-11.2 | done |
| DS-20.C mapping to platform entities | PL-11.3 | done |
| DS-20.D agent-operable OCR APIs | PL-11.4 | done |
| DS-21.A technical SEO baseline | PL-12.1 | done |
| DS-21.B structured metadata | PL-12.2 | done |
| DS-21.C agent discoverability docs | PL-12.3 | done |
| DS-22.A native OCR processing from uploaded files | PL-13.1 | todo |
| DS-22.B audit log UX completeness | PL-13.2 | done |
| DS-22.C self-serve billing automation | PL-13.3 | done |
| DS-22.D offline tolerance (PWA-lite) | PL-13.4 | done |
| DS-22.E malware scanning for uploads | PL-13.5 | done |
| DS-22.F regional date formatting and i18n baseline | PL-13.6 | done |
| DS-22.G high-volume pagination/filtering hardening | PL-13.7 | done |

---

## Plan Items with Completion Notes

## Phase 0 Foundations

### [x] PL-0.1 (DS-2, DS-6) — Supabase auth OTP, workspace/membership tables, RLS baseline
**What was built**
- OTP login + callback + session exchange
- Workspace bootstrap on first auth
- Core schema + RLS policy baseline
- Additional query indexes for permits/approvals/files/reminder deliveries

**Where**
- `src/app/auth/login/page.tsx`
- `src/app/auth/actions.ts`
- `src/app/auth/callback/route.ts`
- `db/migrations/0001_init_core_schema.sql`
- `db/migrations/0002_rls_policies.sql`
- `db/migrations/0003_membership_bootstrap_policies.sql`
- `db/migrations/0008_additional_indexes.sql`

**Status**: done

### [x] PL-0.2 (DS-1) — App shell routes + navigation + design primitives
**What was built**
- Public + protected route scaffolding
- Reusable app shell, card, button primitives

**Where**
- `src/components/app-shell.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/app/app/*`

**Status**: done

### [x] PL-0.3 (DS-10, DS-12.A) — Server-only env separation + signed upload URLs
**What was built**
- Env parsing contract
- Server/browser/admin Supabase clients
- Signed upload endpoint

**Where**
- `src/lib/env.ts`
- `src/lib/supabase/{server,browser,admin}.ts`
- `src/app/api/upload/sign/route.ts`
- `.env.example`

**Status**: done

---

## Phase 1 Permits MVP

### [x] PL-1.1 (DS-3.A) — Permit templates CRUD
**What was built**
- Create/list permit templates
- Qualification gate config
- Approval role sequence input with template steps write

**Where**
- `src/app/app/templates/page.tsx`
- `db/migrations/0004_templates_files_usage.sql` (`permit_template_steps`)

**Status**: done

### [x] PL-1.2 (DS-3.B) — Permit lifecycle create/edit/status transitions
**What was built**
- Permit create/list/detail + transitions
- Close with required note
- Needs changes/reject handling
- Lifecycle timestamp fields

**Where**
- `src/app/app/permits/new/page.tsx`
- `src/app/app/permits/page.tsx`
- `src/app/app/permits/[id]/page.tsx`
- `db/migrations/0007_permit_rejection_fields.sql`

**Status**: done

### [x] PL-1.3 (DS-3.C) — Approval workflow (single-step then multi-step)
**What was built**
- Approval records table + UI log
- Sequential role-based multi-step enforcement
- Step-aware next approver notifications

**Where**
- `src/app/app/permits/[id]/page.tsx`
- `db/migrations/0001_init_core_schema.sql` (`permit_approvals`)
- `db/migrations/0004_templates_files_usage.sql` (`permit_template_steps`)

**Status**: done

### [x] PL-1.4 (DS-7.A) — Realtime permit/approval updates
**What was built**
- Live permit status updates via Supabase Realtime
- Live permit approval event counter updates via Realtime subscription

**Where**
- `src/app/app/permits/[id]/permit-live.tsx`

**Status**: done

### [x] PL-1.5 (DS-8.A) — Permit PDF export v1
**What was built**
- API PDF generation with permit summary + approvals
- Export audit event

**Where**
- `src/app/api/permits/[permitId]/pdf/route.ts`

**Status**: done

---

## Phase 2 Contractor Qualifications

### [x] PL-2.1 (DS-4.A) — Contractors CRUD + search
**What was built**
- Contractor create/list/search
- Plan limit enforcement + messaging

**Where**
- `src/app/app/contractors/page.tsx`

**Status**: done

### [x] PL-2.2 (DS-4.B) — Qualification types CRUD + validity rules
**What was built**
- Qualification type create/list with validity months and evidence requirement

**Where**
- `src/app/app/qualifications/types/page.tsx`

**Status**: done

### [x] PL-2.3 (DS-4.C, DS-3.E) — Qualification records + evidence uploads
**What was built**
- Qualification assignment records
- Evidence upload widget + file metadata registration
- Permit attachment upload + file metadata

**Where**
- `src/app/app/qualifications/records/page.tsx`
- `src/components/files/upload-widget.tsx`
- `src/app/api/files/register/route.ts`
- `src/app/app/permits/[id]/page.tsx`

**Status**: done

### [x] PL-2.4 (DS-4.D, DS-11.A) — Reminder settings + digest + logs
**What was built**
- Reminder settings + logs page
- Cron-triggered digest endpoint
- Idempotent delivery key usage

**Where**
- `src/app/app/reminders/page.tsx`
- `src/app/api/jobs/reminders/digest/route.ts`
- `db/migrations/0001_init_core_schema.sql` (`reminder_*`)

**Status**: done

---

## Phase 3 Packaging + Limits + Audit

### [x] PL-3.1 (DS-5.C) — Plan limit enforcement
**What was built**
- Server-side limits for permits, contractors, members, storage

**Where**
- `src/lib/limits.ts`
- call sites in contractors/permits/admin/upload APIs

**Status**: done

### [x] PL-3.2 (DS-5.A) — Usage meter UI + upgrade prompts
**What was built**
- Usage meters in settings
- Starter/Growth/Scale pricing page

**Where**
- `src/app/app/settings/page.tsx`
- `src/app/pricing/page.tsx`

**Status**: done

### [x] PL-3.3 (DS-9.A) — Audit events helper + coverage
**What was built**
- Shared audit logger
- Coverage across templates, permits, approvals, reminders, files, billing, members

**Where**
- `src/lib/audit/events.ts`
- integrated in major actions/endpoints

**Status**: done

### [x] PL-3.4 (DS-13) — Test suite baseline + CI scripts
**What was built**
- Vitest config + domain tests
- TS lint/test/build scripts
- GitHub CI workflow enforcing lint/test/build on push + PR

**Where**
- `vitest.config.ts`
- `src/test/*.spec.ts`
- `package.json`
- `.github/workflows/ci.yml`

**Status**: done

---

## Phase 4 Beta Hardening

### [x] PL-4.1 (DS-3.D) — Qualification gating block/warn
**What was built**
- Reusable gate evaluator + enforcement on submit/approve

**Where**
- `src/lib/domain/qualification-gate.ts`
- `src/app/app/permits/[id]/page.tsx`

**Status**: done

### [x] PL-4.2 (DS-8.B) — Reports dashboard
**What was built**
- Status counts, avg time-to-approve, top expiring quals, missing quals

**Where**
- `src/app/app/reports/page.tsx`

**Status**: done

### [x] PL-4.3 (DS-11.B) — Backpressure + resend controls
**What was built**
- Summary/full mode
- resend capability + linkage metadata

**Where**
- `db/migrations/0005_reminder_delivery_controls.sql`
- `src/app/api/jobs/reminders/digest/route.ts`
- `src/app/app/reminders/page.tsx`

**Status**: done

### [x] PL-4.4 (DS-2.C) — Expanded RBAC
**What was built**
- Server-side role checks on sensitive actions (templates, permits, approvals, member admin)

**Where**
- action handlers in `src/app/app/*`

**Status**: done

### [x] PL-4.5 (DS-5.B) — Dedicated hosting playbook
**What was built**
- Dedicated hosting operations/commercial playbook doc

**Where**
- `docs/dedicated-hosting-playbook.md`

**Status**: done

---

## Phase 5 Pilot-Readiness Finishers

### [x] PL-5.1 (DS-0, DS-7.B, DS-9.B, DS-14) — Product/commercial/docs + email notifications
**What was built**
- Public pages (`/pricing`, `/how-it-works`)
- Email provider integration (Resend) for submit/approve/digest
- Notification docs and compliance posture copy
- Dashboard activation metric visibility

**Where**
- `src/app/{pricing,how-it-works}/page.tsx`
- `src/lib/notifications/{email,workspace-recipients}.ts`
- `docs/email-notifications.md`
- `src/app/app/dashboard/page.tsx`

**Status**: done

### [x] PL-5.2 (DS-1.E, DS-10.B) — UX safety polish + endpoint hardening
**What was built**
- Added explicit in-memory rate limits for auth and key mutation endpoints
- Added safer user-facing auth error copy for throttled OTP attempts
- Reinforced workspace scoping checks on all high-risk mutations (no cross-workspace writes)

**Where**
- `src/lib/security/rate-limit.ts`
- `src/app/auth/actions.ts`
- `src/app/auth/login/page.tsx`
- `src/app/api/{upload/sign,files/register,billing/upgrade,jobs/reminders/digest}.ts`

**Status**: done

### [x] PL-5.3 (DS-3.B, DS-3.C) — Decision UX completion
**What was built**
- Needs changes / reject actions with required comments
- Closure note requirement + lifecycle timestamps
- Sequential step enforcement
- Auto-activation cron endpoint for approved permits at/after start time

**Where**
- `src/app/app/permits/[id]/page.tsx`
- `db/migrations/0007_permit_rejection_fields.sql`
- `src/app/api/jobs/permits/activate/route.ts`

**Status**: done

### [x] PL-5.4 (DS-0.A, DS-12.B) — Ops checklists/runbook + seed tooling
**What was built**
- Shared SaaS runbook
- Step-by-step environment, migration, bucket, realtime, and job checklist
- Demo seed scaffold SQL

**Where**
- `docs/ops-runbook.md`
- `scripts/seed-demo.sql`

**Status**: done

---

## Next Update Rule
When any DS-linked feature is shipped:
1. Update DS → PL table status
2. Update matching PL block (`What built / Where / Status`)
3. Keep status honest (`done` only when truly complete)

---

## Phase 6 Production Readiness (New)

### [x] PL-6.1 (DS-15.A) — Reliability and recovery controls
**What was built**
- Added bounded retry for outbound email notifications
- Added notification failure persistence for triage/replay
- Added RPO/RTO + restore drill guidance

**Where**
- `src/lib/notifications/email.ts`
- `db/migrations/0015_ops_and_lifecycle.sql` (`notification_failures`)
- `src/app/api/jobs/reminders/digest/route.ts`
- `src/app/api/app/training/invites/route.ts`
- `docs/production/reliability-recovery.md`

**Status**: done

### [x] PL-6.2 (DS-15.B) — Operational security hardening
**What was built**
- Added documented WAF/abuse and secret rotation playbook
- Added least-privilege/access review operational guidance
- Applied app-level rate limits to key endpoints (previously implemented)

**Where**
- `docs/production/security-hardening.md`
- `src/lib/security/rate-limit.ts`
- key API/auth routes using rate limiting

**Status**: done

### [x] PL-6.3 (DS-15.C) — Observability and alerting
**What was built**
- Added structured logging helper with correlation ids
- Instrumented reminder digest and permit activation jobs with start/complete events
- Added observability SLI/alert guidance document

**Where**
- `src/lib/observability/log.ts`
- `src/app/api/jobs/reminders/digest/route.ts`
- `src/app/api/jobs/permits/activate/route.ts`
- `docs/production/observability.md`

**Status**: done

### [x] PL-6.4 (DS-15.D) — Data lifecycle/governance
**What was built**
- Added retention settings model and API
- Added workspace export endpoint for portability
- Added offboarding job endpoint (metadata run + summary) and tracking model

**Where**
- `db/migrations/0015_ops_and_lifecycle.sql`
- `src/app/api/app/workspace/retention/route.ts`
- `src/app/api/app/workspace/export/route.ts`
- `src/app/api/app/workspace/offboarding/route.ts`

**Status**: done

### [x] PL-6.5 (DS-15.E) — Delivery/change management
**What was built**
- Added delivery/change management playbook covering promotion and migration safety
- Added migration preflight/rollback runbook
- Added executable release gate scripts for migration checks + lint/test/build + env validation
- Documented current CI workflow scope blocker and temporary manual control

**Where**
- `docs/production/delivery-change-management.md`
- `docs/production/migration-runbook.md`
- `scripts/check-migrations.sh`
- `scripts/preflight.sh`
- `scripts/release.sh`
- `package.json` scripts (`preflight`, `check:migrations`, `release:check`)

**Status**: done

### [x] PL-6.6 (DS-15.F) — Performance & scale validation
**What was built**
- Added performance/scale validation plan with SLO targets and review cadence
- Added explicit load-test targets for critical APIs/jobs
- Added k6 load-test scripts and npm runners for permit, reminder, and training flows

**Where**
- `docs/production/performance-scale.md`
- `loadtests/permit-actions.js`
- `loadtests/reminder-digest.js`
- `loadtests/training-invites.js`
- `package.json`

**Status**: done

### [x] PL-6.7 (DS-15.G) — Enterprise readiness track
**What was built**
- Added enterprise readiness blueprint for SSO path, residency controls, and SLA tiers

**Where**
- `docs/production/enterprise-readiness.md`

**Status**: done

---

## Phase 7 Feature Expansion (DS-16)

### [x] PL-7.1 (DS-16.A) — Permit duplication + quick issue
**What was built**
- Added “Issue again” action on permits list
- Duplicate flow carries forward core permit fields into a new draft copy

**Where**
- `src/app/app/permits/page.tsx`

**Status**: done

### [x] PL-7.2 (DS-16.B) — Permit calendar/timeline
**What was built**
- Added `/app/permits/calendar` timeline page grouped by date
- Added status filtering and quick navigation from permits list

**Where**
- `src/app/app/permits/calendar/page.tsx`
- `src/app/app/permits/page.tsx`

**Status**: done

### [x] PL-7.3 (DS-16.C) — Contractor portal (scoped)
**What was built**
- Added contractor-facing scoped portal link model
- Added admin flow for creating/revoking contractor portal links
- Added tokenized contractor portal page showing only invite-linked contractor qualification/training data

**Where**
- `db/migrations/0014_contractor_portal_invites.sql`
- `src/app/api/app/onboarding/contractor-portal-invites/route.ts`
- `src/app/api/public/contractor-portal/[token]/route.ts`
- `src/app/contractor/portal/[token]/page.tsx`
- `src/app/app/admin/page.tsx`

**Status**: done

### [x] PL-7.4 (DS-16.D) — Qualification requirement packs
**What was built**
- Added qualification pack + pack item data model
- Added pack CRUD baseline UI

**Where**
- `db/migrations/0009_feature_expansion_core.sql`
- `src/app/app/qualifications/packs/page.tsx`
- `src/app/app/qualifications/page.tsx`

**Status**: done

### [x] PL-7.5 (DS-16.E) — Permit preconditions checklist
**What was built**
- Added permit checklist item model and permit detail UI
- Added activation blocking when required checklist items are incomplete

**Where**
- `db/migrations/0009_feature_expansion_core.sql`
- `src/app/app/permits/[id]/page.tsx`

**Status**: done

### [x] PL-7.6 (DS-16.F) — Toolbox talk / briefing capture
**What was built**
- Added permit briefing model and attendee acknowledgements model
- Added permit detail UI for creating briefings and listing attendees

**Where**
- `db/migrations/0010_toolbox_shares_site_dashboards.sql`
- `src/app/app/permits/[id]/page.tsx`

**Status**: done

### [x] PL-7.7 (DS-16.G) — Needs-changes task tracking
**What was built**
- Added permit task model
- Auto-generated task on needs-changes decision
- Added task completion actions in permit detail

**Where**
- `db/migrations/0009_feature_expansion_core.sql`
- `src/app/app/permits/[id]/page.tsx`

**Status**: done

### [x] PL-7.8 (DS-16.H) — Smart reminder actions
**What was built**
- Added renew (+12 months) and waive (with reason) actions from reminders page
- Persists waiver metadata and writes audit events

**Where**
- `db/migrations/0009_feature_expansion_core.sql`
- `src/app/app/reminders/page.tsx`

**Status**: done

### [x] PL-7.9 (DS-16.I) — Expiring public share links
**What was built**
- Added share link + access log models
- Added permit detail create/revoke share link actions
- Added public read-only share endpoint with expiry/revocation checks and access logging

**Where**
- `db/migrations/0010_toolbox_shares_site_dashboards.sql`
- `src/app/app/permits/[id]/page.tsx`
- `src/app/api/app/permits/[permitId]/share-links/route.ts`
- `src/app/api/public/permits/share/[token]/route.ts`

**Status**: done

### [x] PL-7.10 (DS-16.J) — Template versioning + rollback
**What was built**
- Added template version snapshots data model
- Snapshot on template create and rollback actions
- Added selectable version rollback UI (choose specific snapshot)

**Where**
- `db/migrations/0009_feature_expansion_core.sql`
- `src/app/app/templates/page.tsx`

**Status**: done

### [x] PL-7.11 (DS-16.K) — Site-level dashboards
**What was built**
- Added site-level dashboard page with per-site permit and qualification metrics
- Added navigation entry from main dashboard

**Where**
- `src/app/app/dashboard/sites/page.tsx`
- `src/app/app/dashboard/page.tsx`

**Status**: done

### [x] PL-7.12 (DS-16.L) — Mobile field UX optimization
**What was built**
- Existing field-friendly button sizing and compact action patterns
- Upload and decision actions optimized for quick mobile workflows
- Added mobile sticky quick-action rail on permit detail

**Where**
- `src/components/ui/button.tsx`
- `src/app/app/permits/[id]/page.tsx`
- `src/components/files/upload-widget.tsx`

**Status**: done

---

## Phase 8 AI-Agent-Friendly API Parity (DS-17)

### [x] PL-8.1 (DS-17.A) — API parity for major workflows
**What was built**
- Added unified permit action API for transitions, approvals/decisions, checklist operations, and task completion
- Added qualification pack API (list/create)
- Added reminder smart-action API (bulk renew/waive)

**Where**
- `src/app/api/app/permits/[permitId]/actions/route.ts`
- `src/app/api/app/qualifications/packs/route.ts`
- `src/app/api/app/reminders/qualifications/actions/route.ts`

**Status**: done

### [x] PL-8.2 (DS-17.B) — Contract normalization
**What was built**
- Added standard API response envelope helpers for success/error
- Added structured error codes/messages across new agent routes

**Where**
- `src/lib/api/response.ts`
- `src/app/api/app/**/route.ts`

**Status**: done

### [x] PL-8.3 (DS-17.C) — API RBAC/scoping parity
**What was built**
- Enforced workspace scoping + role checks in new API routes
- Added validation-driven payload gating with predictable failure responses

**Where**
- `src/app/api/app/permits/[permitId]/actions/route.ts`
- `src/app/api/app/qualifications/packs/route.ts`
- `src/app/api/app/reminders/qualifications/actions/route.ts`

**Status**: done

### [x] PL-8.4 (DS-17.D) — Agent integration docs
**What was built**
- Published API capability matrix with endpoint contracts, roles, payloads, and common error semantics

**Where**
- `docs/agent-api.md`

**Status**: done

---

## Phase 9 Workforce Onboarding (DS-18)

### [x] PL-9.1 (DS-18.A) — Internal employee onboarding invites
**What was built**
- Employee invite data model with role/email/expiry/token state
- Admin UI to generate and view internal employee onboarding links
- Public accept API requiring logged-in matching email

**Where**
- `db/migrations/0011_onboarding_invites.sql`
- `src/app/app/admin/page.tsx`
- `src/app/api/public/onboarding/employee/[token]/route.ts`

**Status**: done

### [x] PL-9.2 (DS-18.B) — Contractor self-onboarding invites
**What was built**
- Contractor invite data model with token/expiry/revocation/acceptance
- Admin UI to generate contractor invite links
- Public acceptance API to self-register contractor records

**Where**
- `db/migrations/0011_onboarding_invites.sql`
- `src/app/app/admin/page.tsx`
- `src/app/api/public/onboarding/contractor/[token]/route.ts`

**Status**: done

### [x] PL-9.3 (DS-18.C) — Invite security + lifecycle
**What was built**
- Invite expiry, revocation, one-time acceptance semantics in APIs
- Validation checks for not_found/revoked/expired/used states
- Added revoke actions in Admin UI for employee/contractor invites

**Where**
- `src/app/api/public/onboarding/employee/[token]/route.ts`
- `src/app/api/public/onboarding/contractor/[token]/route.ts`
- `src/app/api/app/onboarding/{employee-invites,contractor-invites}/route.ts`
- `src/app/app/admin/page.tsx`

**Status**: done

### [x] PL-9.4 (DS-18.D) — Agent-operable onboarding APIs
**What was built**
- Agent API endpoints for invite list/create/revoke workflows
- Public accept endpoints for tokenized onboarding completion

**Where**
- `src/app/api/app/onboarding/employee-invites/route.ts`
- `src/app/api/app/onboarding/contractor-invites/route.ts`
- `src/app/api/public/onboarding/employee/[token]/route.ts`
- `src/app/api/public/onboarding/contractor/[token]/route.ts`

**Status**: done

---

## Phase 10 Training & Induction System (DS-19)

### [x] PL-10.1 (DS-19.A) — Training modules
**What was built**
- Training module model and module create/list APIs
- Training UI for module creation and visibility

**Where**
- `db/migrations/0012_training_induction.sql`
- `src/app/api/app/training/modules/route.ts`
- `src/app/app/training/page.tsx`

**Status**: done

### [x] PL-10.2 (DS-19.B) — Bulk training dispatch
**What was built**
- Bulk invite creation for multiple contractor employee emails
- Contractor contact records auto-upsert on dispatch
- Optional email dispatch using configured provider

**Where**
- `src/app/api/app/training/invites/route.ts`
- `db/migrations/0012_training_induction.sql`
- `src/app/app/training/page.tsx`

**Status**: done

### [x] PL-10.3 (DS-19.C) — Electronic completion flow
**What was built**
- Public tokenized training endpoint with expiry/revocation/used-state checks
- Completion endpoint records completion payload and timestamp

**Where**
- `src/app/api/public/training/[token]/route.ts`
- `db/migrations/0012_training_induction.sql`

**Status**: done

### [x] PL-10.4 (DS-19.D) — Profile crediting
**What was built**
- Credited completion records persisted to contractor training history
- Training UI shows completed induction credits

**Where**
- `db/migrations/0012_training_induction.sql` (`contractor_training_records`)
- `src/app/api/public/training/[token]/route.ts`
- `src/app/app/training/page.tsx`

**Status**: done

### [x] PL-10.5 (DS-19.E) — Agent-operable training APIs
**What was built**
- API routes for modules, invite dispatch/listing, and completion verification
- Machine-usable JSON responses for agent workflows

**Where**
- `src/app/api/app/training/modules/route.ts`
- `src/app/api/app/training/invites/route.ts`
- `src/app/api/public/training/[token]/route.ts`

**Status**: done

---

## Phase 11 OCR Intake for Training/Certs (DS-20)

### [x] PL-11.1 (DS-20.A) — OCR ingestion
**What was built**
- Added OCR document intake model and parse endpoint accepting OCR text payloads (PDF/image OCR output)

**Where**
- `db/migrations/0013_training_gating_and_ocr.sql`
- `src/app/api/app/ocr/parse/route.ts`

**Status**: done

### [x] PL-11.2 (DS-20.B) — Structured extraction output
**What was built**
- Persisted field-level extraction rows (`name`, `training_name`, `expiry_date`) with confidence and snippet metadata

**Where**
- `db/migrations/0013_training_gating_and_ocr.sql`
- `src/app/api/app/ocr/parse/route.ts`

**Status**: done

### [x] PL-11.3 (DS-20.C) — Mapping to entities
**What was built**
- Added OCR apply endpoint to map extracted data into contractor training records and/or contractor qualification records

**Where**
- `src/app/api/app/ocr/apply/route.ts`

**Status**: done

### [x] PL-11.4 (DS-20.D) — Agent-operable OCR APIs
**What was built**
- Agent-accessible OCR parse + apply endpoints with normalized response contracts

**Where**
- `src/app/api/app/ocr/parse/route.ts`
- `src/app/api/app/ocr/apply/route.ts`

**Status**: done

---

## Phase 12 SEO & Public Discoverability (DS-21)

### [x] PL-12.1 (DS-21.A) — Technical SEO baseline
**What was built**
- Added sitemap and robots routes
- Added canonical/OG/twitter metadata baseline in root layout
- Added web manifest metadata route for installability/discoverability

**Where**
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/manifest.ts`
- `src/app/layout.tsx`

**Status**: done

### [x] PL-12.2 (DS-21.B) — Structured metadata
**What was built**
- Added JSON-LD WebSite schema on landing page
- Added JSON-LD Organization schema on How it works page
- Added JSON-LD FAQ schema on Pricing page

**Where**
- `src/app/page.tsx`
- `src/app/how-it-works/page.tsx`
- `src/app/pricing/page.tsx`

**Status**: done

### [x] PL-12.3 (DS-21.C) — Agent discoverability docs
**What was built**
- Existing agent API capability matrix published and retained as discoverable doc
- Added public docs index page for discoverability

**Where**
- `docs/agent-api.md`
- `src/app/docs/page.tsx`

**Status**: done

---

## Phase 13 Gap Remediation & V1.1 Enhancements (DS-22)

### [ ] PL-13.1 (DS-22.A) — Native OCR processing from uploaded files
**Planned**
- Add OCR backend integration for direct PDF/image parsing from uploaded files
- Support engine abstraction + retry/failure handling
- Connect OCR parse route to actual file pipeline instead of text-only mode

**Status**: todo

### [x] PL-13.2 (DS-22.B) — Audit log UX completeness
**What was built**
- Added audit log table UX in Admin with search/action/object filters
- Added server-side pagination for audit events
- Added payload drill-down view per audit event

**Where**
- `src/app/app/admin/page.tsx`

**Status**: done

### [x] PL-13.3 (DS-22.C) — Self-serve billing automation (Stripe)
**What was built**
- Added Stripe checkout session endpoint for plan selection
- Added Stripe billing portal endpoint for subscription management
- Added settings UI controls to launch checkout and billing portal
- Added Stripe webhook endpoint and event persistence for subscription state sync
- Added billing event visibility in settings (latest webhook events list)

**Where**
- `src/app/api/billing/stripe/checkout/route.ts`
- `src/app/api/billing/stripe/portal/route.ts`
- `src/app/api/billing/stripe/webhook/route.ts`
- `src/lib/billing/stripe.ts`
- `db/migrations/0017_billing_webhook_events.sql`
- `src/app/app/settings/{page.tsx,billing-controls.tsx}`
- `.env.example` (Stripe keys)

**Status**: done (self-serve checkout, portal, webhook sync, and billing event visibility delivered for hosted SaaS flow)

### [x] PL-13.4 (DS-22.D) — Offline tolerance (PWA-lite)
**What was built**
- Added service worker registration and offline cache baseline
- Added offline draft save/restore helper for permit creation flow
- Added local offline submission queue with online replay to permit create API

**Where**
- `public/sw.js`
- `src/components/pwa/register-sw.tsx`
- `src/app/layout.tsx`
- `src/app/app/permits/new/offline-draft.tsx`
- `src/app/api/app/permits/create/route.ts`

**Status**: done (service worker + offline queue + reconnect replay for permit creation delivered)

### [x] PL-13.5 (DS-22.E) — Malware scanning for uploads
**What was built**
- Added file scan result model and scanning job endpoint
- New uploads now create pending scan records
- New file registrations are blocked by default (`pending_scan`) until scanner marks clean
- Added staging-path to final-path promotion model; clean files are moved from staging to final path only after scan pass
- Added pluggable scan engine abstraction with optional ClamAV HTTP integration and baseline fallback

**Where**
- `db/migrations/0016_billing_offline_scan_i18n.sql` (`file_scan_results`)
- `db/migrations/0019_file_staging_promotion.sql` (`files.final_path`)
- `src/app/api/upload/sign/route.ts`
- `src/components/files/upload-widget.tsx`
- `src/app/api/files/register/route.ts`
- `src/app/api/jobs/files/scan/route.ts`
- `src/lib/security/file-scan.ts`
- `.env.example` (`CLAMAV_SCAN_ENDPOINT`)

**Status**: done (staging upload + blocked-by-default + scan-gated promotion to final path implemented)

### [x] PL-13.6 (DS-22.F) — Regional date formatting and i18n baseline
**What was built**
- Added workspace locale/date format settings and persistence
- Exposed preferences in settings UI with EU default (`en-IE`, `DD/MM/YYYY`)
- Added shared date formatting utility and applied it to admin audit/invite date rendering

**Where**
- `db/migrations/0016_billing_offline_scan_i18n.sql` (workspace locale/date fields)
- `src/app/app/settings/page.tsx`
- `src/lib/i18n/date.ts`
- `src/app/app/admin/page.tsx`

**Status**: done (workspace locale/date preferences + shared formatter + rollout across core operational pages delivered)

### [x] PL-13.7 (DS-22.G) — Pagination/filtering hardening
**What was built**
- Implemented server-side pagination + filtering in permits list
- Implemented server-side pagination + filtering in contractors list
- Implemented paginated/filterable admin audit list for high-volume events

**Where**
- `src/app/app/permits/page.tsx`
- `src/app/app/contractors/page.tsx`
- `src/app/app/admin/page.tsx`

**Status**: done
