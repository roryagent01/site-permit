-- DS-3.B/DS-3.C closure + needs changes support

alter table permits
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists needs_changes_reason text;
