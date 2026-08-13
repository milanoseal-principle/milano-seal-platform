begin;

-- 051_damiani50_governed_scope.sql
-- Additive metadata hardening only. This migration MUST NOT create, consume,
-- reset, activate, deactivate, or otherwise mutate DAMIANI50 commercial state.
-- Existing discount value, status, usage_limit, usage_count, start/end dates,
-- and redemption history remain authoritative and untouched.

update public.discount_codes
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'program', 'damiani_reentry',
  'single_use', true,
  'allowed_source_channel', 'damiani-reentry',
  'eligible_service_scope', 'professional_services'
),
updated_at = now()
where upper(code) = 'DAMIANI50';

-- Fail closed if the canonical production code is absent. A deployment must not
-- silently claim the governed Damiani re-entry program is wired when the record
-- itself is missing.
do $$
begin
  if not exists (
    select 1
    from public.discount_codes
    where upper(code) = 'DAMIANI50'
  ) then
    raise exception 'damiani50_discount_code_missing';
  end if;
end $$;

commit;
