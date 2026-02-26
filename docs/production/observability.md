# Observability & Alerts (DS-15.C)

## Structured logs
- JSON logs via `src/lib/observability/log.ts`
- Correlation id from `x-request-id` or generated fallback
- Current instrumented jobs:
  - reminder digest
  - permit activation

## Core SLIs to track
- Auth OTP success rate
- Permit submit/approve latency
- Reminder digest send success rate
- Training invite completion rate

## Alert thresholds (initial)
- reminder digest failure rate > 10% over 15m
- permit activation job failure any run
- OCR apply errors > 5% over 1h
