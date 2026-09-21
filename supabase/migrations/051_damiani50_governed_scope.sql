begin;

-- 051_damiani50_governed_scope.sql
-- Additive metadata hardening only. This migration MUST NOT create, consume,
-- reset, activate, deactivate, or otherwise mutate DAMIANI50 commercial state.
-- Existing discount value, status, usage_limit, usage_count, start/end dates,
-- and redemption history remain authoritative and untouched.
--
-- Fresh preview/shadow databases may intentionally contain no operational
-- courtesy-code rows. Schema replay must therefore remain data-independent.
-- Production launch validation owns the fail-closed requirement that an approved
-- commercial code exists before the Damiani re-entry program is represented as
-- available.

update public.discount_codes
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'program', 'damiani_reentry',
  'single_use', true,
  'allowed_source_channel', 'damiani-reentry',
  'eligible_service_scope', 'professional_services'
),
updated_at = now()
where upper(code) = 'DAMIANI50';

commit;
