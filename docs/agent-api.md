# Agent API Capability Matrix (DS-17)

All endpoints return JSON. New API-first routes use envelope:
- success: `{ ok: true, data, error: null, meta? }`
- error: `{ ok: false, data: null, error: { code, message, details? } }`

## Permits
### POST `/api/app/permits/:permitId/actions`
Role-gated action endpoint for agent operation.

Actions:
1. Transition
```json
{ "action": "transition", "nextStatus": "submitted|active|closed|cancelled|needs_changes", "closureNote?": "...", "reason?": "..." }
```
2. Decision
```json
{ "action": "decision", "decision": "approved|rejected|changes", "comment": "..." }
```
3. Checklist
```json
{ "action": "checklist", "mode": "add|toggle", "label?": "...", "required?": true, "itemId?": "uuid", "checked?": true }
```
4. Task
```json
{ "action": "task", "mode": "complete", "taskId": "uuid" }
```

Common errors: `unauthorized`, `forbidden`, `invalid_payload`, `invalid_transition`, `validation_error`.

## Qualification Packs
### GET `/api/app/qualifications/packs`
List packs in current workspace.

### POST `/api/app/qualifications/packs`
Create pack.
```json
{ "name": "Hot Work Pack", "description": "...", "qualificationTypeIds": ["uuid"] }
```
Role: `admin|owner`.

## Reminder Smart Actions
### POST `/api/app/reminders/qualifications/actions`
Bulk renew/waive qualification records.
```json
{ "action": "renew|waive", "qualificationIds": ["uuid"], "reason?": "required for waive" }
```
Role: `admin|owner`.

## Existing Core APIs
- `POST /api/upload/sign`
- `POST /api/files/register`
- `POST /api/jobs/reminders/digest`
- `POST /api/jobs/permits/activate`
- `GET /api/permits/:permitId/pdf`
- `POST /api/billing/upgrade`

These remain supported for agent flows.
