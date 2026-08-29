begin;

alter table public.ron_documents
  add column if not exists storage_bucket text not null default 'deal-documents';

comment on column public.ron_documents.storage_bucket is
  'Private source bucket for the Matter document. Existing client uploads use deal-documents; BlueNotary transfer remains server-side only.';

commit;
