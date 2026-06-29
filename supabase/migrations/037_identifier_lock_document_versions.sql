create table if not exists identifier_locks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  field_id text not null,
  locked_value text not null,
  confirmed_by text not null,
  locked_at timestamptz not null default now(),
  approval_cycle integer not null default 1
);
create table if not exists document_versions (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null,
  stage text not null,
  file_hash text not null,
  actor text not null,
  source_file text not null,
  notes text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
