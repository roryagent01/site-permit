-- DS-11.B resend/backpressure controls metadata

alter table reminder_deliveries
  add column if not exists mode text not null default 'full' check (mode in ('full','summary')),
  add column if not exists resend_of uuid references reminder_deliveries(id) on delete set null,
  add column if not exists send_status text not null default 'sent' check (send_status in ('sent','failed','skipped'));

create index if not exists idx_reminder_deliveries_workspace_sent_at
  on reminder_deliveries (workspace_id, sent_at desc);
