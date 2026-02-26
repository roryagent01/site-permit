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
| DS-13.B CI gates | PL-3.4 | partial |
| DS-14.A ICP definition | PL-5.1 | done |
| DS-14.B success metrics | PL-5.1 | done |
| DS-15.A reliability/recovery | PL-6.1 | todo |
| DS-15.B operational security hardening | PL-6.2 | todo |
| DS-15.C observability/alerting | PL-6.3 | todo |
| DS-15.D data lifecycle/governance | PL-6.4 | todo |
| DS-15.E delivery/change management | PL-6.5 | todo |
| DS-15.F performance/scale validation | PL-6.6 | todo |
| DS-15.G enterprise readiness track | PL-6.7 | todo |
| DS-16.A permit duplication + quick issue | PL-7.1 | done |
| DS-16.B permit calendar/timeline | PL-7.2 | done |
| DS-16.C contractor portal scoped access | PL-7.3 | partial |
| DS-16.D qualification requirement packs | PL-7.4 | done |
| DS-16.E permit preconditions checklist | PL-7.5 | done |
| DS-16.F toolbox talk capture | PL-7.6 | todo |
| DS-16.G needs-changes task tracking | PL-7.7 | done |
| DS-16.H smart reminder actions | PL-7.8 | done |
| DS-16.I expiring public share links | PL-7.9 | todo |
| DS-16.J template versioning + rollback | PL-7.10 | partial |
| DS-16.K site-level dashboards | PL-7.11 | todo |
| DS-16.L mobile field UX optimization | PL-7.12 | partial |

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

**Where**
- `vitest.config.ts`
- `src/test/*.spec.ts`
- `package.json`

**Status**: partial (workflow file not pushed yet due token scope)

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

### [ ] PL-6.1 (DS-15.A) — Reliability and recovery controls
**Planned**
- Add backup verification cadence and restore drill procedure
- Add bounded retry + DLQ strategy for failed reminders/emails
- Define RPO/RTO targets by tier

**Status**: todo

### [ ] PL-6.2 (DS-15.B) — Operational security hardening
**Planned**
- Add edge abuse controls/WAF profile
- Add secret rotation and key rollover runbook
- Add support/admin least-privilege policy and access review cadence

**Status**: todo

### [ ] PL-6.3 (DS-15.C) — Observability and alerting
**Planned**
- Add structured logging + request correlation IDs
- Add metrics dashboard definitions and alert thresholds
- Add on-call response procedures

**Status**: todo

### [ ] PL-6.4 (DS-15.D) — Data lifecycle/governance
**Planned**
- Add retention policy implementation by plan
- Add tenant offboarding with archival/hard-delete paths
- Add tenant data export/portability workflow

**Status**: todo

### [ ] PL-6.5 (DS-15.E) — Delivery/change management
**Planned**
- Enable CI workflow once token scope supports push
- Add staged environment promotion flow
- Add migration preflight + rollback playbook

**Status**: todo

### [ ] PL-6.6 (DS-15.F) — Performance & scale validation
**Planned**
- Add load test suite for permit/reminder critical paths
- Define SLO baselines and capacity guardrails
- Add periodic query/index review process

**Status**: todo

### [ ] PL-6.7 (DS-15.G) — Enterprise readiness track
**Planned**
- Add SSO/SAML path for dedicated hosting
- Add region/residency controls documentation
- Add support SLA and escalation implementation details

**Status**: todo

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
- Added contractor-facing portal route with qualification visibility
- Added self-service evidence upload per qualification record
- Included authenticated access baseline

**Where**
- `src/app/contractor/page.tsx`
- `src/components/files/upload-widget.tsx`

**Status**: partial (needs dedicated contractor invite flow + strict contractor-only RLS isolation)

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

### [ ] PL-7.6 (DS-16.F) — Toolbox talk / briefing capture
**Planned**
- Add briefing records linked to permit with participant acknowledgements

**Status**: todo

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

### [ ] PL-7.9 (DS-16.I) — Expiring public share links
**Planned**
- Add read-only tokenized permit links with expiry/revocation

**Status**: todo

### [x] PL-7.10 (DS-16.J) — Template versioning + rollback
**What was built**
- Added template version snapshots data model
- Snapshot on template create and rollback action to restore a saved snapshot

**Where**
- `db/migrations/0009_feature_expansion_core.sql`
- `src/app/app/templates/page.tsx`

**Status**: partial (needs full edit flow with automatic snapshot per update and full version browser)

### [ ] PL-7.11 (DS-16.K) — Site-level dashboards
**Planned**
- Add per-site scorecards and comparative KPIs

**Status**: todo

### [x] PL-7.12 (DS-16.L) — Mobile field UX optimization
**What was built**
- Existing field-friendly button sizing and compact action patterns
- Upload and decision actions optimized for quick mobile workflows

**Where**
- `src/components/ui/button.tsx`
- `src/app/app/permits/[id]/page.tsx`
- `src/components/files/upload-widget.tsx`

**Status**: partial (dedicated mobile action rail and layout pass still needed)
