-- Forward-only reconciliation of hosted is_operator() with the canonical
-- 20261108180000 staff role allowlist. The hosted operators table is empty;
-- staff identity is already provisioned in auth.users by the existing admin path.
-- An existing inactive or nonstaff operator binding is an explicit veto.
-- Revocation must clear the server-issued staff role or disable the account;
-- deleting a binding alone is not a revocation under the canonical identity model.
-- No customer, payment, execution, or identity rows are changed.
begin;
create or replace function public.is_operator()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and coalesce(u.raw_app_meta_data->>'disabled', 'false') <> 'true'
      and (u.banned_until is null or u.banned_until <= now())
      and u.raw_app_meta_data->>'role' in ('operator','founder','founder_admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator','finance','finance_operator','client_support','compliance_reviewer','admin','owner')
      and not exists (
        select 1 from public.operators o
        where o.user_id = u.id
          and (o.is_active is distinct from true
            or o.role is null
            or o.role not in ('operator','founder','founder_admin','admin_operator','ops_manager','execution_coordinator','apostille_coordinator','finance','finance_operator','client_support','compliance_reviewer','admin','owner'))
      )
  )
$$;
revoke all on function public.is_operator() from public, anon;
grant execute on function public.is_operator() to authenticated, service_role;

-- Keep direct Matter mutations on the existing governed server path.
revoke insert, update, delete, truncate, references, trigger on public.deals from authenticated;
commit;
