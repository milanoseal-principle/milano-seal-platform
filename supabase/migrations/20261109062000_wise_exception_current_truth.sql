-- Bounded fair scans and current-row exception resolution; no payment authority.
begin;
create index if not exists wise_exception_scan_age_idx on public.wise_reconciliation_exceptions(last_detected_at,deal_id);
create index if not exists wise_pending_observation_idx on public.deals(payment_observed_at,id)
 where payment_confirmed is false and payment_settlement_status in ('observed_pending','mismatch_review');
create or replace function public.wise_exception_scan_candidates(p_before timestamptz,p_limit integer default 200)
returns setof public.deals language sql stable security definer set search_path='' as $$
 select d.* from public.deals d left join public.wise_reconciliation_exceptions e on e.deal_id=d.id
 where d.payment_confirmed is false and d.payment_settlement_status in ('observed_pending','mismatch_review')
   and d.payment_observed_at is not null and d.payment_observed_at<=least(p_before,now()-interval '5 minutes')
 order by coalesce(e.last_detected_at,'-infinity'::timestamptz),d.id
 limit least(greatest(coalesce(p_limit,200),1),200);
$$;
revoke all on function public.wise_exception_scan_candidates(timestamptz,integer) from public,anon,authenticated;
grant execute on function public.wise_exception_scan_candidates(timestamptz,integer) to service_role;

create or replace function public.resolve_wise_exceptions_from_current_truth(p_limit integer default 500)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare candidate record;resolved integer:=0;
begin
 for candidate in
   select e.id,d.payment_settlement_status,d.payment_status from public.wise_reconciliation_exceptions e join public.deals d on d.id=e.deal_id
   where e.status='open' and (
     (d.payment_confirmed is true and d.payment_status='paid' and d.payment_settlement_status='cleared'
       and d.amount_due>0 and d.amount_paid>0 and d.amount_due::text not in ('NaN','Infinity','-Infinity')
       and d.amount_paid::text not in ('NaN','Infinity','-Infinity') and round(d.amount_paid*100)=round(d.amount_due*100))
     or d.payment_status in ('failed','refunded')
     or d.payment_settlement_status in ('failed','cancelled','expired','reversed','voided','refunded','rejected','revoked','superseded'))
   order by e.id limit least(greatest(coalesce(p_limit,500),1),500) for update of d,e skip locked
 loop
   update public.wise_reconciliation_exceptions set status='resolved',resolved_at=clock_timestamp(),updated_at=clock_timestamp(),
     resolution=case when candidate.payment_status in ('failed','refunded') or candidate.payment_settlement_status in ('failed','cancelled','expired','reversed','voided','refunded','rejected','revoked','superseded')
       then 'Attempt invalidated; no current settlement authority remains. Fresh governed submission or operator review is required.'
       else 'Current canonical Matter no longer requires pending-settlement reconciliation.' end
   where id=candidate.id and status='open';
   if found then resolved:=resolved+1;end if;
 end loop;
 return resolved;
end;$$;
revoke all on function public.resolve_wise_exceptions_from_current_truth(integer) from public,anon,authenticated;
grant execute on function public.resolve_wise_exceptions_from_current_truth(integer) to service_role;
commit;
