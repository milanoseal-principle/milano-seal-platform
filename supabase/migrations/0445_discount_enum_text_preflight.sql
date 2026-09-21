begin;

-- Fresh/shadow databases replay legacy migration 035 before the canonical text
-- discount contract in 045. PostgreSQL cannot change an enum-backed column to
-- text while legacy CHECK/default expressions still bind enum operators.
-- Drop only those legacy expressions here; 045 recreates the canonical checks.

do $$
declare r record;
begin
  if to_regclass('public.discount_codes') is null then
    return;
  end if;

  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.discount_codes'::regclass
      and contype = 'c'
      and (
        pg_get_constraintdef(oid) ilike '%discount_type%'
        or pg_get_constraintdef(oid) ilike '%status%'
      )
  loop
    execute format(
      'alter table public.discount_codes drop constraint if exists %I',
      r.conname
    );
  end loop;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name='discount_codes'
      and column_name='discount_type'
  ) then
    alter table public.discount_codes alter column discount_type drop default;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name='discount_codes'
      and column_name='status'
  ) then
    alter table public.discount_codes alter column status drop default;
  end if;
end $$;

commit;
