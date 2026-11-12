-- B01 read-only audit of operator identity bindings. Counts only: no names, emails or ids.
-- Run in the production SQL editor before applying 20261112130000_alliance_operator_identity.sql
-- (the first two counts) and again after it (all counts).
select jsonb_build_object(
  'observed_at', now(),
  'operators', (select count(*) from public.operators),
  'operators_without_user_id', (select count(*) from public.operators where user_id is null),
  'user_ids_bound_to_more_than_one_operator', (select count(*) from (select user_id from public.operators where user_id is not null group by user_id having count(*) > 1) d),
  'profile_binding_columns_present', (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'operators' and column_name in ('profile_id', 'referral_code')),
  'unique_indexes_present', (select coalesce(jsonb_agg(indexname order by indexname), '[]'::jsonb) from pg_indexes where schemaname = 'public' and indexname in ('operators_user_id_uidx', 'operators_profile_id_uidx', 'operators_referral_code_uidx'))
) as b01_operator_binding_audit;
