# WorkPermitOS Implementation Plan (DS-mapped)

## Phase 0 Foundations
- [x] PL-0.1 (DS-2, DS-6): Supabase auth OTP, workspace/membership tables, RLS baseline
- [x] PL-0.2 (DS-1): App shell routes + navigation + design primitives
- [x] PL-0.3 (DS-10): Server-only env separation + signed upload URLs

## Phase 1 Permits MVP
- [x] PL-1.1 (DS-3.A): Permit templates CRUD
- [x] PL-1.2 (DS-3.B): Permit lifecycle create/edit/status transitions
- [x] PL-1.3 (DS-3.C): Approval chain (single-step then multi-step baseline table + flow)
- [x] PL-1.4 (DS-7.A): Realtime permit/approval updates (permit status live updates)
- [x] PL-1.5 (DS-8.A): Permit PDF export v1

## Phase 2 Contractor Qualifications
- [x] PL-2.1 (DS-4.A): Contractors CRUD + search
- [x] PL-2.2 (DS-4.B): Qualification types CRUD + validity rules
- [x] PL-2.3 (DS-4.C): Contractor qualification records + evidence uploads (record scaffolding + signed upload API)
- [x] PL-2.4 (DS-4.D, DS-11.A): Reminder settings + digest + logs

## Phase 3 Packaging + Limits + Audit
- PL-3.1 (DS-5.C): Plan limits enforcement
- PL-3.2 (DS-5.A): Usage meter UI + upgrade prompts
- PL-3.3 (DS-9.A): Audit events helper and action coverage
- PL-3.4 (DS-13): Test suite baseline + CI gates

## Phase 4 Beta Hardening
- PL-4.1 (DS-3.D): Qualification gating block/warn modes
- PL-4.2 (DS-8.B): Reports dashboard metrics
- PL-4.3 (DS-11.B): Reminder backpressure and resend controls
- PL-4.4 (DS-2.C): Granular RBAC
- PL-4.5 (DS-5.B): Dedicated hosting playbook + SKU
