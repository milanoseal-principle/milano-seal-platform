begin;
-- Immutable issued evidence derived from public.deals; never a second pricing authority.
create table public.matter_financial_artifacts (
 id uuid primary key default gen_random_uuid(),matter_id uuid not null references public.deals(id),
 kind text not null check(kind in ('PRO_FORMA','INVOICE','RECEIPT','PAID_AND_RELEASED')),version integer not null,
 snapshot jsonb not null,snapshot_sha256 text not null,pdf_sha256 text,generator_version text not null default 'milano-financial-v1',
 supersedes_id uuid references public.matter_financial_artifacts(id),created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),
 unique(matter_id,kind,version),check(snapshot_sha256=encode(sha256(convert_to(snapshot::text,'utf8')),'hex')),
 check(pdf_sha256 is null or pdf_sha256 ~ '^[a-f0-9]{64}$')
);
alter table public.matter_financial_artifacts enable row level security;
revoke all on public.matter_financial_artifacts from public,anon,authenticated;
grant select,insert,update on public.matter_financial_artifacts to service_role;
create function public.financial_artifact_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='DELETE' or (to_jsonb(new)-'pdf_sha256')<>(to_jsonb(old)-'pdf_sha256') or old.pdf_sha256 is not null then raise exception 'FINANCIAL_ARTIFACT_IMMUTABLE';end if;return new;
end $$;
create trigger financial_artifact_immutable before update or delete on public.matter_financial_artifacts for each row execute function public.financial_artifact_guard();
create function public.issue_financial_artifact(p_actor uuid,p_matter uuid,p_kind text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d public.deals%rowtype;actor jsonb;current_snapshot jsonb;prior public.matter_financial_artifacts%rowtype;issued public.matter_financial_artifacts%rowtype;settled boolean;
begin
 select to_jsonb(u) into actor from auth.users u where u.id=p_actor and coalesce(u.raw_app_meta_data->>'disabled','false')<>'true' and (u.banned_until is null or u.banned_until<=now());
 select * into d from public.deals where id=p_matter for update;
 if actor is null or d.id is null or not coalesce((actor->'raw_app_meta_data'->>'role' in ('founder','founder_admin','admin_operator','ops_manager') or (actor->'raw_app_meta_data'->>'role'='client' and nullif(actor->>'email_confirmed_at','') is not null and lower(btrim(actor->>'email'))=lower(btrim(d.email)))),false) then raise exception using errcode='42501',message='FINANCIAL_ARTIFACT_FORBIDDEN';end if;
 if p_kind not in ('PRO_FORMA','INVOICE','RECEIPT','PAID_AND_RELEASED') then raise exception 'INVALID_ARTIFACT_KIND';end if;
 if d.quote_approved_at is null or d.quote_review_required is distinct from false or d.pricing_version is null or jsonb_typeof(d.quote_breakdown) is distinct from 'array' then raise exception 'APPROVED_CANONICAL_QUOTE_REQUIRED';end if;
 if d.final_total is null or d.original_total is null or d.discount_amount is null or d.non_discountable_total is null or d.eligible_subtotal is null or d.amount_due is null or d.currency !~ '^[A-Z]{3}$' or d.final_total<0 or d.final_total::text in ('NaN','Infinity','-Infinity') or d.original_total-d.discount_amount<>d.final_total or d.eligible_subtotal+d.non_discountable_total<>d.original_total or d.discount_amount>d.eligible_subtotal or d.discount_amount<0 or d.eligible_subtotal<0 or d.non_discountable_total<0 or d.amount_due<0 or d.amount_due>d.final_total then raise exception 'CANONICAL_FINANCIAL_SNAPSHOT_INCONSISTENT';end if;
 if exists(select 1 from jsonb_array_elements(d.quote_breakdown) item where jsonb_typeof(item->'amount') is distinct from 'number' or (item->>'amount')::numeric<0 or item->>'category'='external_provider_notarial_fee') or (select sum((item->>'amount')::numeric) from jsonb_array_elements(d.quote_breakdown) item) is distinct from d.original_total then raise exception 'CANONICAL_LINE_ITEMS_INCONSISTENT';end if;
 settled:=d.payment_confirmed is true and d.payment_status='paid' and d.payment_settlement_status='cleared' and d.amount_due>0 and round(d.amount_paid*100)=round(d.amount_due*100);
 if p_kind in ('RECEIPT','PAID_AND_RELEASED') and settled is distinct from true then raise exception 'VERIFIED_SETTLEMENT_REQUIRED';end if;
 if p_kind='PAID_AND_RELEASED' and (d.is_paid_and_released is distinct from true or (d.final_total is not null and d.final_total>0 and d.amount_paid+case when d.balance_payment_status='paid' and d.balance_paid_at is not null then coalesce(d.balance_amount_received,0) else 0 end=d.final_total) is distinct from true) then raise exception 'CANONICAL_RELEASE_REQUIRED';end if;
 current_snapshot:=jsonb_build_object('matter_id',d.id,'display_id',d.deal_id,'client_name',d.client_name,'document_type',d.document_type,'destination_country',d.destination_country,'execution_method',d.quote_execution_method,'pricing_version',d.pricing_version,'quote_approved_at',d.quote_approved_at,'line_items',d.quote_breakdown,'currency',d.currency,'original_total',d.original_total,'eligible_subtotal',d.eligible_subtotal,'non_discountable_total',d.non_discountable_total,'discount_amount',d.discount_amount,'final_total',d.final_total,'amount_due',d.amount_due,'amount_paid',d.amount_paid,'payment_confirmed',coalesce(settled,false),'payment_status',d.payment_status,'payment_reference',d.wise_reference,'released',d.is_paid_and_released);
 select * into prior from public.matter_financial_artifacts where matter_id=p_matter and kind=p_kind order by version desc limit 1;
 if prior.snapshot=current_snapshot then return to_jsonb(prior);end if;
 insert into public.matter_financial_artifacts(matter_id,kind,version,snapshot,snapshot_sha256,supersedes_id,created_by)
 values(p_matter,p_kind,coalesce(prior.version,0)+1,current_snapshot,encode(sha256(convert_to(current_snapshot::text,'utf8')),'hex'),prior.id,p_actor) returning * into issued;
 insert into public.audit_events(actor_id,event_type,route,metadata) values(p_actor,'FINANCIAL_ARTIFACT_ISSUED',p_matter::text,jsonb_build_object('artifact_id',issued.id,'snapshot_sha256',issued.snapshot_sha256,'kind',p_kind));
 return to_jsonb(issued);
end $$;
revoke all on function public.issue_financial_artifact(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.issue_financial_artifact(uuid,uuid,text) to service_role;
insert into public.retention_classes(class_id,canonical_name,description,duration_rule,start_event,start_timestamp_source,sensitivity,deletion_method,required_deletion_evidence,system_of_record,owner_subsystem,policy_status)
values('FINANCIAL_ARTIFACT','Issued financial artifact','Immutable canonical quote, invoice and verified receipt','REVIEW_REQUIRED','ARTIFACT_ISSUED','matter_financial_artifacts.created_at','confidential','No deletion until policy approval','Human approval and immutable deletion audit','matter_financial_artifacts','finance','review_required') on conflict do nothing;
commit;
