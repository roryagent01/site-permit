# WorkPermitOS Design Specification

Version: 0.9 (SMB-first €19.99 tier + Shared SaaS + Dedicated Hosting Add-on)
Design Language: Clean Industrial / Trust-Centered Blue UI (mobile-first, field-friendly)

This document is the authoritative design and implementation specification for WorkPermitOS: a lightweight, modern Permit-to-Work + Contractor Qualification tracking platform for small businesses (10–100 internal users) with an upsell path to larger sites and optional dedicated hosting.

Each requirement has a stable Design Spec ID (DS-x.x) that maps 1:1 to implementation items in plan.md.

---

## DS-0 Product Goals + Scope

**Goal:** Replace paper/spreadsheet PTW and certificate tracking with a simple, affordable, self-serve tool:
- Create permit templates (Hot Work, Working at Height, Confined Space, Electrical, etc.)
- Issue permits, route approvals, track status, store audit trail
- Manage contractors and qualifications (Manual Handling, Working at Height, Insurance, RAMS, etc.)
- Automated expiry reminders (digest/batched)
- Export permits (PDF) and basic reporting

**Commercial positioning:**
- SMB wedge: €19.99/month (shared hosting, strict limits, self-serve)
- Growth tiers: 100 users, 500 users
- Dedicated hosting is extra (separate price, separate infra)

**In scope (baseline MVP):**
- Next.js App Router + Vercel
- Supabase (Auth, Postgres, Storage, Realtime)
- Multi-tenant (workspace/site)
- Core PTW workflow + contractor quals + reminders
- Simple PDF export
- Basic analytics dashboard

**Out of scope (baseline MVP):**
- Full enterprise EHS suite (incidents, observations, toolbox talks, etc.)
- Complex SIMOPS conflict engine (advanced)
- Offline-first native mobile app
- Formal compliance/validation packages (Part 11/Annex 11)
- SSO/SAML (later, dedicated hosting tier)

### DS-0.A Release Maturity Roadmap
- **Alpha (2–3 weeks):** permits + approvals + contractor qualifications + reminders + audit baseline
- **Beta:** role model hardening, exports, reliability, templating, improved reporting
- **Production:** dedicated hosting option, SSO, stronger audit immutability, retention, org structures

---

## DS-1 Experience and UI System

### DS-1.A Visual Design System
- High-contrast, readable UI; trust-first.
- “Field mode” layouts: big touch targets, minimal clutter.
- Shadcn-style primitives and consistent action hierarchy.

### DS-1.B App Information Architecture
**Public:**
- / landing + pricing + “How it works”
- /auth/login email OTP

**Protected app shell (/app/*):**
- /app/dashboard
- /app/permits (list)
- /app/permits/new
- /app/permits/[id]
- /app/templates (permit templates)
- /app/contractors
- /app/qualifications (training types + requirements)
- /app/reminders (settings + delivery logs)
- /app/reports
- /app/settings (workspace, billing, limits)
- /app/admin (roles, audit logs)

### DS-1.C Interaction Feedback
- Every state change is visible: “Draft → Submitted → Approved → Active → Closed/Cancelled”.
- Clear “who’s blocking this permit” status indicator.
- Inline validation for missing prerequisites (template required fields, missing contractor quals, etc.).

### DS-1.D Responsive Styling Principles
- Mobile-first; no horizontal overflow.
- Big CTA buttons for issuing/approving permits.
- Permit detail page optimized for on-site use (one-thumb actions).

### DS-1.E UX Design Standards
- One clear primary action per screen.
- Destructive actions require modal confirmation (no browser confirm).
- Do not display raw SQL/errors; show user-safe copy.

---

## DS-2 Authentication and Access Model

### DS-2.A OTP Authentication
- Email OTP only via Supabase Auth.

### DS-2.B Tenant Model
- Multi-tenant workspace = “Company”.
- Workspace contains one or more “Sites” (optional; SMB may have 1).
- All data scoped by workspace_id and optionally site_id.

### DS-2.C RBAC Baseline
Roles:
- Owner (billing + all permissions)
- Admin (templates, quals, contractors, reports)
- Approver (approve permits)
- Issuer (create/submit permits)
- Viewer (read-only)

RBAC is enforced server-side; UI reflects permission gating.

---

## DS-3 Permit-to-Work Workflow

### DS-3.A Permit Types / Templates
Templates define:
- Permit category (Hot Work, Confined Space, etc.)
- Required fields (location, start/end, isolation required, hazards, controls)
- Required approvals (single or multi-step)
- Required qualifications (optional gate rules)
- Attachments allowed (photos, RAMS, method statement)

### DS-3.B Permit Lifecycle
Statuses:
- draft
- submitted
- needs_changes
- approved
- active
- closed
- cancelled
- expired

Rules:
- Only Issuer/Admin can submit.
- Only Approver/Admin can approve.
- Approved → Active occurs automatically on start time or manually “Activate now”.
- Permit can be closed only by Issuer/Admin; closure requires end time + notes.

### DS-3.C Approval Workflow
Approvals are explicit records with:
- approver user
- decision (approved/rejected/changes)
- timestamp
- comment

Multi-step approvals supported (simple sequenced list).
Email notifications on submit + pending approval.

### DS-3.D Qualification Gating (Optional)
On submit or approve, the system can block/flag if:
- contractor missing required qualification
- qualification expired or expiring soon (configurable threshold)
- required document missing (e.g., insurance)

Behavior options per template:
- Block submission/approval
- Allow with warning + record override reason

### DS-3.E Attachments
- Permit attachments stored in Supabase Storage.
- File limits enforced per plan (size + storage quota).
- Permits support attaching RAMS, photos, and certificates as evidence.

---

## DS-4 Contractor Qualification Management

### DS-4.A Contractor Records
Contractor entity includes:
- company name
- contact details
- assigned site(s)
- status (active/inactive)
- notes

### DS-4.B Qualifications Catalog
Qualification types are workspace-managed:
- Manual Handling
- Working at Height
- Confined Space
- Electrical (e.g., NICEIC, trade cert)
- Insurance (public liability)
- RAMS review

Each qualification type has:
- name, description
- validity period (months)
- expiry rules (hard expiry vs “review required”)
- evidence requirement (document upload required yes/no)

### DS-4.C Contractor Qualification Instances
Per contractor qualification record:
- qualification_type_id
- issue date, expiry date
- evidence file(s)
- verification status (unverified/verified)
- verified_by + timestamp

### DS-4.D Reminder Engine
- Configurable reminder windows (e.g., 30/14/7 days before expiry).
- Default delivery is daily digest per workspace (to control email costs and avoid spam).
- Reminder log table records what was sent and when.

---

## DS-5 Pricing, Limits, and Packaging

### DS-5.A Plan Tiers (Hosted Shared SaaS)
**Starter (€19.99/month)**
- Up to 10 internal users
- 25 contractors
- 50 permits/month
- 500MB storage
- Email support only
- Self-serve onboarding only

**Growth**
- Up to 100 internal users
- 200 contractors
- 500 permits/month
- 5GB storage
- Priority email support

**Scale**
- Up to 500 internal users
- 1,000 contractors
- 2,000 permits/month
- 25GB storage
- Priority support + onboarding option

### DS-5.B Dedicated Hosting Add-on
Separate SKU:
- dedicated Supabase project + dedicated Vercel deployment
- custom domain
- custom retention and region options (where possible)
- optional SSO later

Billing: monthly minimum + optional setup fee.

### DS-5.C Enforcement
Limits enforced server-side:
- user count
- contractor count
- monthly permit creation
- storage quota

UI shows usage meter and upgrade CTA.

---

## DS-6 Data Model and Migrations

### DS-6.A Core Tables (minimum)
- workspaces
- workspace_members
- sites
- roles / member_roles
- permit_templates
- permit_template_steps (approval chain)
- permits
- permit_approvals
- contractors
- qualification_types
- contractor_qualifications
- files (metadata)
- audit_events
- reminder_settings
- reminder_deliveries (logs)
- usage_counters (permits/month, storage used, etc.)

### DS-6.B RLS Tenant Isolation
- Every tenant table includes workspace_id.
- RLS policies enforce: user must be member of workspace to read/write.
- No client access to cross-workspace records.

### DS-6.C Indexes & Constraints
Index common queries:
- permits by site/status/date
- contractor qualifications by expiry date

Constraints:
- status enums
- unique membership constraints
- foreign key integrity

---

## DS-7 Realtime + Notifications

### DS-7.A Realtime
Supabase Realtime on:
- permits (status changes)
- permit_approvals
- reminder_deliveries (optional)

UI updates in-place for permit status and approval events.

### DS-7.B Email Notifications
Events:
- Permit submitted → approvers notified
- Approval decision → issuer notified
- Qualification expiring → daily digest to admins/owners (and optionally contractor owner email)

Delivery requirements:
- Batch/digest by default
- Idempotent send logic (no duplicates)
- Logged outcomes for troubleshooting

---

## DS-8 Reporting and Export

### DS-8.A PDF Export
`GET /api/permits/:permitId/pdf`

Includes:
- permit summary + status
- approvals with timestamps
- hazards/controls
- contractor details
- attachments list (optionally embedded thumbnails later)

Available when permit is submitted+ (not just draft).

### DS-8.B Reports Dashboard
Basic reporting:
- permits by status (7d/30d)
- time-to-approve
- top expiring qualifications
- contractors missing qualifications

---

## DS-9 Audit Trail and Compliance Posture

### DS-9.A Audit Events
Immutable event log (append-only):
- permit created/updated/submitted/approved/closed/cancelled
- contractor created/updated
- qualification created/verified/updated
- template changes
- role changes
- exports triggered

Shape:
- workspace_id, actor_user_id, action, object_type, object_id, payload, created_at, ip_address (where available)

### DS-9.B Intended Compliance Positioning
- Marketed as a practical operations tool.
- Avoid claims like “Part 11 compliant” unless you build a dedicated controls package.

---

## DS-10 Security

### DS-10.A Secrets
- Service role key server-only.
- Storage signed URLs for uploads/downloads.
- No sensitive secrets in client bundles.

### DS-10.B Hardening Baseline
- Rate limit auth + key endpoints.
- Strict server validation on all mutations.
- Protect against IDOR by enforcing workspace scoping in every API handler.

---

## DS-11 Reliability and Job Processing

### DS-11.A Reminder Job
Cron-triggered endpoint:
- computes expiring qualifications
- generates digest emails
- writes reminder logs

Idempotency via “delivery key” per workspace/day.

### DS-11.B Backpressure
- Email send caps per workspace/day.
- If a workspace exceeds cap, send a “summary only” email and flag in logs.

---

## DS-12 Deployment and Operations

### DS-12.A Environment Contract
`.env.example` includes:
- Supabase URL/keys
- Email provider keys
- Cron secret
- Storage bucket names
- Plan limit constants

### DS-12.B Supabase Setup Checklist
- Run migrations
- Create storage buckets:
  - permit_attachments
  - qualification_evidence
- Enable realtime replication for key tables
- Configure cron job runner

---

## DS-13 Testing and Quality Gates

### DS-13.A Automated Tests
Permit lifecycle tests:
- draft → submit → approve → close
- rejection / needs changes

RBAC tests:
- issuer cannot approve
- viewer cannot submit

RLS tests:
- tenant isolation enforced

Reminder job tests:
- expiry window detection
- dedupe logic

PDF export smoke test.

### DS-13.B CI Gates
- lint + test + build on Node >= 20

---

## DS-14 PMF Definition and Commercial Validation

### DS-14.A ICP
Small companies with hazardous work + contractors:
- small construction contractors
- facilities maintenance firms
- small manufacturing plants
- HVAC/electrical contractors managing site permits

### DS-14.B Success Metrics
- Activation: first permit created within 30 minutes
- Weekly active teams
- Permits per week per site
- Contractor qualifications tracked
- Renewal reminder engagement rate
- Conversion Starter → Growth

---

# plan.md Implementation Plan (mapped 1:1 to DS IDs)

## Phase 0 Foundations (Day 1–2)
- PL-0.1 (DS-2, DS-6): Supabase project, auth OTP, workspace + membership tables, RLS baseline
- PL-0.2 (DS-1): App shell routes + nav + shadcn primitives
- PL-0.3 (DS-10): Server-only env separation + signed upload URLs

## Phase 1 Permits MVP (Day 3–7)
- PL-1.1 (DS-3.A): Permit templates CRUD (basic fields + required fields)
- PL-1.2 (DS-3.B): Permit create/edit, lifecycle statuses
- PL-1.3 (DS-3.C): Approval chain (single-step first, then multi-step)
- PL-1.4 (DS-7.A): Realtime updates for permit + approvals
- PL-1.5 (DS-8.A): Permit PDF export v1

## Phase 2 Contractor Qualifications (Day 8–11)
- PL-2.1 (DS-4.A): Contractors CRUD + list/search
- PL-2.2 (DS-4.B): Qualification types CRUD + validity rules
- PL-2.3 (DS-4.C): Contractor qualification records + evidence uploads
- PL-2.4 (DS-4.D, DS-11.A): Reminder settings + digest generator + reminder logs

## Phase 3 Packaging + Limits + Billing Hooks (Day 12–14)
- PL-3.1 (DS-5.C): Plan limits enforcement (users/contractors/permits/storage)
- PL-3.2 (DS-5.A): Usage meter UI + upgrade prompts (no payment processing required in v0 if you prefer manual billing)
- PL-3.3 (DS-9.A): Audit events helper + coverage on key actions
- PL-3.4 (DS-13): Test suite baseline + CI scripts

## Phase 4 Beta Hardening (Backlog)
- PL-4.1 (DS-3.D): Qualification gating on submit/approve (block or warn)
- PL-4.2 (DS-8.B): Reports dashboard (time-to-approve, expiring quals)
- PL-4.3 (DS-11.B): Backpressure caps + resend controls
- PL-4.4 (DS-2.C): Expanded RBAC (granular permissions)
- PL-4.5 (DS-5.B): Dedicated hosting deployment playbook + SKU definition

---

## MVP Acceptance Criteria (minimum)
A workspace can:
1. define a permit template
2. create a permit from template
3. submit for approval
4. approve/reject with audit trail
5. attach files to permit
6. create contractors + qualifications + expiry dates
7. send a daily digest of expiring qualifications
8. export a permit PDF
9. enforce tenant isolation via RLS

---

## DS-15 Production Readiness Additions (New)

### DS-15.A Reliability & Recovery
- Add scheduled database backup verification checks (restore drill cadence).
- Define RPO/RTO targets per tier (shared vs dedicated hosting).
- Add dead-letter handling for failed reminder/email jobs.
- Add retry policies with bounded exponential backoff for outbound notifications.

### DS-15.B Security Hardening (Operational)
- Add WAF / bot protection at edge.
- Add centralized secret rotation policy and key rollover playbook.
- Add structured audit access controls (least privilege for support/admin users).
- Add abuse controls beyond per-endpoint rate limits (workspace-level throttling).

### DS-15.C Observability & Alerting
- Add structured logs with correlation IDs for API/job flows.
- Add metrics dashboards for key SaaS SLIs:
  - auth success/failure rate
  - permit submission latency
  - approval completion time
  - reminder delivery success rate
- Add alert thresholds and on-call runbook for degraded states.

### DS-15.D Data Lifecycle & Governance
- Add retention policy controls by plan/tier.
- Add hard-delete + archival workflow for offboarding tenants.
- Add export package endpoint for tenant data portability.
- Add privacy controls for DSAR-style requests (where applicable).

### DS-15.E Delivery & Change Management
- Enforce CI + required checks before merge.
- Add environment promotion model (dev → staging → prod).
- Add migration safety process (preflight checks + rollback guidance).
- Add release notes/changelog discipline for customer-visible changes.

### DS-15.F Performance & Scale Validation
- Add load tests for permit and reminders workflows.
- Define baseline SLOs and capacity limits per plan.
- Add query-performance budget and periodic index review.

### DS-15.G Enterprise Readiness Track
- Add optional SSO/SAML implementation plan for dedicated hosting.
- Add tenant-specific residency/region controls and documentation.
- Add support SLA policy and escalation paths.


---

## DS-16 Feature Expansion (Product Improvements)

### DS-16.A Permit Duplication + Quick Issue
- Allow users to duplicate an existing permit into a new draft.
- Include “Issue again” action from permit detail/list for recurring tasks.

### DS-16.B Permit Calendar / Timeline
- Add calendar/timeline view of permits by status and start/end windows.
- Include filters by site, contractor, and permit category.

### DS-16.C Contractor Portal (Scoped Access)
- Add contractor-facing limited-access view for qualification status and evidence uploads.
- Restrict contractors to only their own records and assigned tasks.

### DS-16.D Qualification Requirement Packs
- Define reusable qualification packs by work type.
- Apply packs to templates/sites/contractors.

### DS-16.E Permit Preconditions Checklist
- Add configurable pre-start checklist with required sign-off.
- Block activation until mandatory checks are complete.

### DS-16.F Toolbox Talk / Briefing Capture
- Capture pre-work briefing details and participants.
- Store acknowledgement records linked to permit.

### DS-16.G Needs-Changes Task Tracking
- Generate actionable tasks from “needs changes” decisions.
- Track assignee, due date, and completion state.

### DS-16.H Smart Reminder Actions
- Add direct actions from reminder context (renewed, waive with reason, bulk update).
- Record action outcomes in reminder and audit logs.

### DS-16.I Expiring Public Share Links (Read-Only)
- Generate time-bound read-only links for permit review by external stakeholders.
- Support revocation and access logging.

### DS-16.J Template Versioning + Rollback
- Version templates on each change.
- Allow rollback to previous versions with audit trace.

### DS-16.K Site-Level Dashboarding
- Add per-site scorecards and multi-site analytics filtering.
- Show operational KPIs by site and period.

### DS-16.L Mobile Field UX Optimization
- Add mobile-optimized action rails, larger controls, and reduced form friction.
- Prioritize one-thumb actions and media-first evidence capture.

---

## DS-17 AI-Agent-Friendly API-First Requirement (New)

### DS-17.A API parity for core capabilities
- Every major workflow must be executable through documented APIs, not only UI.
- UI may call server actions internally, but equivalent API routes must exist for autonomous agent operation.

### DS-17.B Machine-usable contracts
- Use stable identifiers and predictable JSON request/response structures.
- Return explicit, non-ambiguous error codes/messages for retry/branch logic.

### DS-17.C API security parity
- Enforce workspace scoping and RBAC in APIs at least as strictly as UI.
- Do not expose privileged operations only via hidden endpoints.

### DS-17.D Agent integration documentation
- For each major capability, document endpoint, roles, payload schema, and failure behavior.

---

## DS-18 Workforce Onboarding (Internal + Contractors)

### DS-18.A Internal employee onboarding via invite link
- Workspace owners/admins can generate invite links for internal employees.
- Invite acceptance flow creates workspace membership with predefined role.

### DS-18.B Contractor self-onboarding via invite link
- Workspace owners/admins can generate contractor onboarding links.
- Contractor can submit company/contact details and self-register into workspace contractor records.

### DS-18.C Invite security + lifecycle
- Invite links must be tokenized and time-bound.
- Invite links support revocation and one-time use semantics.
- Invite acceptance events must be auditable.

### DS-18.D Agent-operable onboarding APIs
- Invite creation/list/revoke/accept flows must be API-accessible for AI agent automation.

---

## DS-19 Contractor Site Induction & Training (Embedded)

### DS-19.A Training modules
- Workspace can create site induction/training modules with title, summary, and training link/content reference.

### DS-19.B Bulk training link dispatch
- Admin/issuer can send training links to multiple contractor employees in one action.
- Dispatch supports many recipients per contractor assignment.

### DS-19.C Electronic completion before site arrival
- Recipient opens unique tokenized link, completes induction electronically, and completion is recorded.
- Link expiry/revocation and completion state must be enforced.

### DS-19.D Profile crediting
- Completed induction is credited to contractor employee profile/history in platform records.
- Completion should be queryable in contractor context for permit gating/reporting.

### DS-19.E Agent-operable APIs
- Module create/list, invite send/list, and completion verification must be API-accessible.

---

## DS-20 Document OCR for Training/Certification Intake

### DS-20.A OCR ingestion
- Allow PDF/image upload for training records/certifications.
- Run OCR extraction to identify key fields (person name, training name, issue/expiry dates, provider where available).

### DS-20.B Structured extraction output
- Store extracted fields with confidence scores and raw text snippets.
- Support user review/correction before saving to qualification/training records.

### DS-20.C Mapping to platform entities
- Map extracted data into contractor contacts, qualification records, or training completion records.
- Keep source-document linkage for auditability.

### DS-20.D Agent-operable OCR APIs
- Expose OCR parse and apply endpoints for autonomous agent workflows.

---

## DS-21 Public Web Presence & SEO (New)

### DS-21.A Technical SEO baseline
- Provide `/sitemap.xml` and `/robots.txt`.
- Ensure canonical metadata and descriptive titles/descriptions for public pages.

### DS-21.B Structured metadata
- Add Organization/WebSite JSON-LD on public pages where applicable.

### DS-21.C Agent discoverability docs
- Keep public API capability docs indexable and linkable from docs/navigation.

---

## DS-22 Gap Remediation & V1.1 Enhancements (New)

### DS-22.A Native OCR processing from uploaded files
- Support direct OCR processing from uploaded PDFs/images without requiring pre-extracted text input.
- Add pluggable OCR engine integration (e.g., cloud OCR or local OCR service) with fallback/error handling.

### DS-22.B Audit log UX completeness
- Provide full audit log UI in `/app/admin` with table, filters, and pagination for workspace admins.

### DS-22.C Self-serve billing automation
- Integrate payment gateway (Stripe) for self-serve subscription onboarding and plan upgrades.
- Replace manual billing dependency for Starter/Growth/Scale hosted SaaS flow.
- Implemented in V1.1 with Stripe checkout + billing portal + webhook sync + billing event visibility in settings.
- **Status:** done.

### DS-22.D Offline tolerance (PWA-lite)
- Add service worker strategy to support temporary offline permit drafting and queued submission retry.
- Prioritize permit create/submit flow resilience for field conditions.
- Implemented in V1.1 with service worker registration, offline draft queue, and reconnect replay to permit create API.
- **Status:** done.

### DS-22.E Malware scanning for uploaded evidence
- Scan uploaded evidence files before permanent acceptance/storage.
- Quarantine or block suspicious files and surface safe user messaging.
- Implemented baseline in V1.1 with scan queue/results model, scheduled scanner, pluggable scan adapter, and blocked-by-default file gating until clean.
- **Status:** partial (scan currently post-upload registration; strict pre-storage scanning remains to finalize).

### DS-22.F Regional date formatting and i18n baseline
- Default to locale-aware date formatting with strong support for DD/MM/YYYY in target markets.
- Prevent ambiguity for permit validity and expiry-critical dates.
- Implemented in V1.1 with workspace locale/date preferences, shared formatter utility, and rollout across core operations pages.
- **Status:** done.

### DS-22.G Large-list pagination and filtering hardening
- Add server-side pagination and robust filtering for high-volume lists (`permits`, `contractors`, etc.).
- Ensure performance remains stable at Scale tier volumes.
