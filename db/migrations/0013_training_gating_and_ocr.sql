-- DS-19 gating + DS-20 OCR tables

create table if not exists ocr_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  file_id uuid references files(id) on delete set null,
  source_type text not null default 'upload' check (source_type in ('upload','share','api')),
  status text not null default 'parsed' check (status in ('queued','parsed','failed','applied')),
  raw_text text,
  parser text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists ocr_extractions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  document_id uuid not null references ocr_documents(id) on delete cascade,
  field_name text not null,
  field_value text,
  confidence numeric(5,4),
  snippet text,
  created_at timestamptz not null default now()
);

alter table permit_templates
  add column if not exists training_gate jsonb not null default '{}'::jsonb;

alter table ocr_documents enable row level security;
alter table ocr_extractions enable row level security;

create policy "workspace members can manage ocr_documents"
on ocr_documents for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create policy "workspace members can manage ocr_extractions"
on ocr_extractions for all
using (is_workspace_member(workspace_id))
with check (is_workspace_member(workspace_id));

create index if not exists idx_ocr_documents_workspace_created on ocr_documents (workspace_id, created_at desc);
create index if not exists idx_ocr_extractions_document on ocr_extractions (document_id, field_name);
