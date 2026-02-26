# Independent DS-22 Audit (Codex Sub-Agent)

Date: 2026-02-26
Auditor: independent codex sub-agent (adversarial review)
Scope: `docs/full-spec.md` + `plan.md` + implementation (`src/`, `db/migrations/`)

## Scorecard (0-100)

- Spec alignment: **74**
- Implementation completeness: **71**
- Status honesty: **62**
- Operability: **58**

## Claimed vs Observed (DS-22)

| Item | Claimed | Observed | Evidence | Verdict |
|---|---|---|---|---|
| DS-22.A Native OCR from uploaded files | todo | todo / not implemented | `plan.md` (PL-13.1), `src/app/api/app/ocr/parse/route.ts` | Honest |
| DS-22.B Audit log UX completeness | done | done | `src/app/app/admin/page.tsx` | Justified |
| DS-22.C Self-serve billing automation | done | mostly done | `src/app/api/billing/stripe/{checkout,portal,webhook}/route.ts`, `src/app/app/settings/{page.tsx,billing-controls.tsx}`, `db/migrations/0017_billing_webhook_events.sql` | Mostly justified |
| DS-22.D Offline tolerance (PWA-lite) | done | partial-to-mostly done | `public/sw.js`, `src/components/pwa/register-sw.tsx`, `src/app/app/permits/new/offline-draft.tsx`, `src/app/api/app/permits/create/route.ts` | Over-claimed risk |
| DS-22.E Malware scanning for uploads | done | mostly done (baseline depth caveats) | `src/app/api/files/register/route.ts`, `src/app/api/jobs/files/scan/route.ts`, `src/lib/security/file-scan.ts`, `db/migrations/0016_billing_offline_scan_i18n.sql`, `0018_offline_quarantine_flags.sql`, `0019_file_staging_promotion.sql` | Mostly justified |
| DS-22.F Regional date formatting / i18n baseline | done | partial (rollout consistency caveats) | `db/migrations/0016_billing_offline_scan_i18n.sql`, `src/lib/i18n/date.ts`, `src/app/app/settings/page.tsx` (+ mixed usage patterns noted) | Over-claimed risk |
| DS-22.G Large-list pagination/filtering hardening | done | partial-to-mostly done | `src/app/app/{permits,contractors,admin}/page.tsx`, index migrations | Slight over-claim risk |

## Auditor Findings (priority-ranked)

1. **Status semantics drift** (High): D/F/G were potentially labeled "done" with baseline implementations where robustness criteria are arguable.
2. **Offline resiliency depth** (Medium): queue replay is functional but minimal; conflict/idempotency and richer reconciliation UX could be strengthened.
3. **i18n/date consistency** (Medium): shared formatter exists, but auditor flagged potential inconsistent workspace-preference propagation in some surfaces.
4. **Scale hardening evidence** (Medium): server-side pagination/filters exist; stronger hardening evidence (load/perf criteria) not explicitly documented.
5. **Malware assurance depth** (Low-Medium): strong progress with blocked-by-default + staged promotion, but scanner model remains pragmatic baseline.

## Dispute Candidates (auditor expected pushback)

- Whether DS-22.D should remain "done" for a PWA-lite definition vs "partial" for enterprise-grade offline semantics.
- Whether DS-22.F should be "done" for baseline locale/date objectives vs full app-wide strict preference propagation.
- Whether DS-22.G "hardening" requires explicit benchmark evidence rather than architectural changes alone.

## Final Recommendation from Audit

- Accept major DS-22 progress as real and substantial.
- Keep scrutiny on **status honesty**: consider narrowing "done" claims for any area where robustness criteria are not explicitly met/documented.
- If retaining current statuses, add explicit acceptance criteria language to spec/plan so "done" definitions are unambiguous.

---

## Maintainer Note

This document records the independent sub-agent audit outcome as requested.
Where findings are phrased as "risk" or "mostly," they indicate judgment calls on robustness thresholds rather than absence of implementation.
