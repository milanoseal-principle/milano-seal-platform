begin;

drop policy if exists "Allow anonymous deal submission" on public.deals;
drop policy if exists "Allow anonymous intake" on public.deals;
drop policy if exists "svc_deals" on public.deals;
drop policy if exists "Operators can insert deals" on public.deals;
drop policy if exists "Operators can update deals" on public.deals;
drop policy if exists "Operators can view deals" on public.deals;
drop policy if exists "client_select_own_deal" on public.deals;

revoke all on public.deals from anon;
revoke insert, update, delete, truncate, references, trigger on public.deals from authenticated;
grant select on public.deals to authenticated;
grant all on public.deals to service_role;

create policy "Operators can insert deals"
on public.deals for insert to authenticated
with check (public.is_operator());

create policy "Operators can update deals"
on public.deals for update to authenticated
using (public.is_operator())
with check (public.is_operator());

create policy "Operators can view deals"
on public.deals for select to authenticated
using (public.is_operator());

create policy client_select_own_deal
on public.deals for select to authenticated
using (lower(email) = lower(auth.jwt() ->> 'email'));

commit;
