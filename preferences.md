# preferences.md

## Delivery Preference: Spec-First + Traceable Implementation

For this repository, always follow a **spec-first delivery model**:

1. Create or maintain a **detailed design spec** that fully defines product behavior, architecture, workflows, constraints, and acceptance criteria.
2. Create and maintain an associated **implementation plan** where every design spec reference (e.g., `DS-x.x`) is mapped to one or more plan actions (e.g., `PL-x.x`).
3. For each completed plan action, provide clear **implementation evidence** showing exactly how it was delivered.

## Required Artifacts

### 1) Design Spec (authoritative)
- Must detail requirements comprehensively (not vague summaries).
- Must use stable reference IDs (e.g., `DS-1.A`, `DS-3.C`, etc.).
- Must be treated as the source of truth for scope.

### 2) Plan (execution + traceability)
- Must map every `DS-*` item to at least one `PL-*` action item.
- Must include status for each item (`todo`, `partial`, `done`).
- Must be updated continuously during implementation.

### 3) Evidence per completed item
For each completed mapped item, include:
- **What was implemented**
- **Where it was implemented** (file paths, migrations, APIs, docs)
- **How completion was validated** (tests/build/manual checks as relevant)

## Working Rules
- Do not mark anything as `done` without evidence.
- Keep mapping explicit and auditable.
- If implementation is partial, mark it `partial` and state what remains.
- Keep spec and plan synchronized after each meaningful change.

## Stack Preference (default)
Use this stack by default unless there is a strong technical reason to change:
- **Frontend/App:** Next.js (latest stable), App Router
- **UI:** shadcn/ui + Tailwind CSS
- **Email:** Resend
- **Auth/Data/Storage/Realtime:** Supabase (OTP auth)
- **Hosting:** Vercel

## Flexibility Rule
- Keep the preferred stack as baseline.
- If project constraints suggest a better option, still propose it clearly with trade-offs (cost, complexity, speed, reliability, lock-in), then ask for approval before switching.

## AI-Agent-Friendly Product Requirement (mandatory)
All apps in this repository must be **AI agent friendly by design**.

### Required design rule
Every significant user-facing capability must be operable by an AI agent through stable APIs (not only through UI clicks).

### Minimum implementation expectations
- Expose API endpoints for all core actions (CRUD + lifecycle transitions + exports + approvals + reminders + settings).
- Use predictable request/response contracts and stable identifiers.
- Provide clear error codes/messages suitable for autonomous recovery logic.
- Ensure role/tenant boundaries are enforceable via API (same rules as UI).
- Avoid UI-only critical workflows whenever possible.

### Documentation requirement
For each major feature, document:
- API endpoint(s)
- required roles/permissions
- expected inputs/outputs
- common failure cases and retry guidance

This requirement should be reflected in design specs and plan mapping (DS/PL + evidence).

## Goal
Maintain full end-to-end traceability from design intent (`DS-*`) to implementation action (`PL-*`) to objective evidence in code and docs.
