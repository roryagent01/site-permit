-- DS-22 finalization helpers

alter table permits
  add column if not exists source text not null default 'online' check (source in ('online','offline_queue')),
  add column if not exists source_meta jsonb not null default '{}'::jsonb;

alter table files
  add column if not exists blocked boolean not null default false,
  add column if not exists block_reason text;
