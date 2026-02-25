-- DS-6.C additional performance indexes

create index if not exists idx_permits_workspace_site_status_start
  on permits (workspace_id, site_id, status, start_at desc);

create index if not exists idx_permit_approvals_workspace_permit_decided
  on permit_approvals (workspace_id, permit_id, decided_at desc);

create index if not exists idx_reminder_deliveries_workspace_delivery_key
  on reminder_deliveries (workspace_id, delivery_key);

create index if not exists idx_files_workspace_permit_created
  on files (workspace_id, permit_id, created_at desc);
