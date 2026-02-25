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
| DS-0 Product goals/scope | PL-0.2, PL-5.1 | partial |
| DS-0.A release roadmap | PL-5.4 | partial |
| DS-1.A visual design system | PL-0.2 | done |
| DS-1.B information architecture | PL-0.2 | done |
| DS-1.C interaction feedback | PL-1.2, PL-4.4 | partial |
| DS-1.D responsive principles | PL-0.2 | partial |
| DS-1.E UX standards | PL-4.4, PL-5.2 | partial |
| DS-2.A OTP auth | PL-0.1 | done |
| DS-2.B tenant model | PL-0.1, PL-0.3 | done |
| DS-2.C RBAC baseline | PL-4.4 | done |
| DS-3.A templates | PL-1.1 | done |
| DS-3.B permit lifecycle | PL-1.2, PL-5.3 | partial |
| DS-3.C approval workflow | PL-1.3, PL-5.3 | partial |
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
| DS-6.C indexes/constraints | PL-0.1 | partial |
| DS-7.A realtime | PL-1.4 | partial |
| DS-7.B email notifications | PL-5.1 | partial |
| DS-8.A PDF export | PL-1.5 | done |
| DS-8.B reports dashboard | PL-4.2 | done |
| DS-9.A audit events | PL-3.3 | done |
| DS-9.B compliance posture copy | PL-5.1 | partial |
| DS-10.A secrets handling | PL-0.3 | done |
| DS-10.B hardening baseline | PL-5.2 | partial |
| DS-11.A reminder job | PL-2.4 | done |
| DS-11.B backpressure | PL-4.3 | done |
| DS-12.A env contract | PL-0.3 | done |
| DS-12.B supabase setup checklist | PL-5.4 | partial |
| DS-13.A automated tests | PL-3.4 | partial |
| DS-13.B CI gates | PL-3.4 | partial |
| DS-14.A ICP definition | PL-5.1 | done |
| DS-14.B success metrics | PL-5.1 | partial |

---

## Plan Items with Completion Notes

## Phase 0 Foundations

### [x] PL-0.1 (DS-2, DS-6) — Supabase auth OTP, workspace/membership tables, RLS baseline
**What was built**
- OTP login + callback + session exchange
- Workspace bootstrap on first auth
- Core schema + RLS policy baseline

**Where**
- `src/app/auth/login/page.tsx`
- `src/app/auth/actions.ts`
- `src/app/auth/callback/route.ts`
- `db/migrations/0001_init_core_schema.sql`
- `db/migrations/0002_rls_policies.sql`
- `db/migrations/0003_membership_bootstrap_policies.sql`

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

**Status**: partial (manual/auto activation rule still needs stricter scheduler support)

### [x] PL-1.3 (DS-3.C) — Approval workflow (single-step then multi-step)
**What was built**
- Approval records table + UI log
- Sequential role-based multi-step enforcement
- Step-aware next approver notifications

**Where**
- `src/app/app/permits/[id]/page.tsx`
- `db/migrations/0001_init_core_schema.sql` (`permit_approvals`)
- `db/migrations/0004_templates_files_usage.sql` (`permit_template_steps`)

**Status**: partial (no dedicated approval timeline component yet)

### [x] PL-1.4 (DS-7.A) — Realtime permit/approval updates
**What was built**
- Live permit status updates via Supabase Realtime

**Where**
- `src/app/app/permits/[id]/permit-live.tsx`

**Status**: partial (approvals realtime subscription not yet added)

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
- Notification docs and messaging posture docs

**Where**
- `src/app/{pricing,how-it-works}/page.tsx`
- `src/lib/notifications/{email,workspace-recipients}.ts`
- `docs/email-notifications.md`

**Status**: partial (compliance wording pass still needed across all marketing copy)

### [ ] PL-5.2 (DS-1.E, DS-10.B) — UX safety polish + endpoint hardening
**Planned**
- Replace inline destructive action confirms with modal pattern
- Add explicit rate limits on auth and mutation endpoints
- Add IDOR regression tests for key endpoints

**Status**: todo

### [x] PL-5.3 (DS-3.B, DS-3.C) — Decision UX completion
**What was built**
- Needs changes / reject actions with required comments
- Closure note requirement
- Sequential step enforcement

**Where**
- `src/app/app/permits/[id]/page.tsx`
- `db/migrations/0007_permit_rejection_fields.sql`

**Status**: partial (activation scheduling rule still basic/manual)

### [x] PL-5.4 (DS-0.A, DS-12.B) — Ops checklists/runbook + seed tooling
**What was built**
- Shared SaaS runbook
- demo seed scaffold SQL

**Where**
- `docs/ops-runbook.md`
- `scripts/seed-demo.sql`

**Status**: partial (Supabase setup checklist should be expanded into step-by-step commands)

---

## Next Update Rule
When any DS-linked feature is shipped:
1. Update DS → PL table status
2. Update matching PL block (`What built / Where / Status`)
3. Keep status honest (`done` only when truly complete)
