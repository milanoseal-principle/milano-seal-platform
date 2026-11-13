-- A rejected Alliance referral cannot become a Matter (B04).
--
-- convert_sales_lead_to_matter locks the lead and links it to its new Matter by setting
-- sales_leads.canonical_matter_id. The application checks the review status before calling it,
-- but a rejection stored between that check and the call would still be converted. This trigger
-- refuses the link itself, inside the same transaction and under the same row lock, so the
-- Matter insert is rolled back with it. It covers every caller of the function.
--
-- No row is rewritten and the conversion function is unchanged.

create or replace function public.sales_leads_refuse_rejected_referral_link()
returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.canonical_matter_id is not null and old.canonical_matter_id is null
    and new.lead_type = 'alliance_referral'
    and new.details->>'review_status' = 'rejected' then
    raise exception using errcode = '22023', message = 'REFERRAL_REJECTED';
  end if;
  return new;
end;
$$;

drop trigger if exists sales_leads_refuse_rejected_referral_link on public.sales_leads;
create trigger sales_leads_refuse_rejected_referral_link
  before update of canonical_matter_id on public.sales_leads
  for each row execute function public.sales_leads_refuse_rejected_referral_link();
