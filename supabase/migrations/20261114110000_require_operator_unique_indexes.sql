-- Require all three operator identity unique indexes; never accept a skipped one.
--
-- 20261112130000_alliance_operator_identity.sql creates operators_user_id_uidx only when existing
-- rows already satisfy it and otherwise skips the index without failing. This follow-on migration
-- closes that gap: if any auth user is still bound to more than one operators row, it stops (and the
-- surrounding transaction rolls back) instead of completing without the constraint. Duplicate rows
-- are never rewritten or deleted; they must be resolved by an operator first.
--
-- Production preflight (supabase/verification/b01_operator_binding_audit.sql, 2026-11-14) found 0
-- operator rows and 0 duplicate user bindings, so on production this only confirms or creates the
-- indexes.
--
-- Forward-only and idempotent. Requires 20261112130000 (operators.profile_id/referral_code).

do $$
begin
  if to_regclass('public.operators') is null then
    raise exception using errcode = '42P01', message = 'OPERATORS_TABLE_MISSING';
  end if;
  if exists (select 1 from public.operators where user_id is not null group by user_id having count(*) > 1) then
    raise exception using errcode = '23505', message = 'OPERATOR_USER_ID_NOT_UNIQUE',
      hint = 'Resolve duplicate operators.user_id bindings, then apply this migration.';
  end if;
  if to_regclass('public.operators_user_id_uidx') is null then
    create unique index operators_user_id_uidx on public.operators (user_id) where user_id is not null;
  end if;
  if to_regclass('public.operators_profile_id_uidx') is null then
    create unique index operators_profile_id_uidx on public.operators (profile_id) where profile_id is not null;
  end if;
  if to_regclass('public.operators_referral_code_uidx') is null then
    create unique index operators_referral_code_uidx on public.operators (upper(referral_code)) where referral_code is not null;
  end if;
end
$$;
