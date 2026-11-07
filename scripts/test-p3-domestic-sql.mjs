import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const db=new PGlite();
await db.exec(`create role anon; create role authenticated; create role service_role;
create schema auth; create table auth.users(id uuid primary key, raw_app_meta_data jsonb, banned_until timestamptz);
create table public.deals(id uuid primary key default gen_random_uuid(),deal_id text unique,access_token text,
 client_name text,email text,phone text,document_type text,destination_country text,origin_state text,
 execution_truth jsonb,payment_status text default 'unpaid',payment_confirmed boolean,amount_paid numeric,currency text,
 status text,deal_status text,quote_review_required boolean,quote_review_reasons jsonb,internal_notes text,
 updated_at timestamptz default now(),last_activity timestamptz,payment_observed_at timestamptz,
 mobile boolean,apostille_required boolean,docs_count int,signers int,witnesses int,quote_approved_at timestamptz,quote_approved_by text);
create table public.sales_leads(id uuid primary key,full_name text,email text,phone text,document_type text,country text,
 details jsonb,product_interest text,lead_type text,source_route text,canonical_matter_id uuid references public.deals(id),linked_by uuid,linked_at timestamptz);
create table public.matter_evidence_ledger(id uuid primary key default gen_random_uuid(),matter_id uuid references public.deals(id),
 event_type text,domain text,actor_type text,actor_id uuid,occurred_at timestamptz,source text,source_reference text,
 prior_value jsonb,new_value jsonb,reason text,metadata jsonb);
insert into auth.users values('00000000-0000-4000-8000-000000000001','{"role":"founder"}',null),('00000000-0000-4000-8000-000000000002','{"role":"client"}',null);
insert into public.sales_leads values('00000000-0000-4000-8000-000000000003','Controlled fixture','test@example.invalid',null,'Affidavit','United States','{"signer_location":"Florida","execution_preference":"mobile"}','domestic_execution','pricing_request','/pricing',null,null,null);`);
await db.exec(`alter table public.deals add column total_price numeric,add column final_total numeric,add column original_total numeric,
 add column amount_due numeric,add column invoice_retainer numeric,add column invoice_balance numeric,add column invoice_subtotal numeric,
 add column lane text,add column execution_tier text,add column base_price numeric,add column witness_total numeric,
 add column eligible_subtotal numeric,add column non_discountable_total numeric,add column discount_amount numeric,
 add column matter_pricing_type text,add column quote_execution_method text,add column pricing_version text,add column quote_breakdown jsonb;
 create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`);
// This fixture tests the existing transition function and P3 RPCs. It is not
// a clean migration-chain or hosted-schema certification (P12 owns that).
const stateSource=readFileSync('supabase/migrations/046_canonical_matter_state_machine.sql','utf8');
const stateFunction=stateSource.match(/create or replace function public\.is_valid_matter_transition[\s\S]*?\$\$;/)?.[0];
if(!stateFunction) throw Error('Canonical state function missing');
await db.exec(stateFunction);
await db.exec(`create table public.matter_state_events(id uuid default gen_random_uuid(),matter_id uuid references public.deals(id),new_state text,created_at timestamptz default now());
create function public.fixture_state_transition() returns trigger language plpgsql as $$ begin
 if TG_OP='INSERT' then
  if not public.is_valid_matter_transition(null,NEW.status) then raise exception 'INVALID_INITIAL_STATE'; end if;
 elsif NEW.status is distinct from OLD.status then
  if not public.is_valid_matter_transition(OLD.status,NEW.status) then raise exception 'INVALID_TRANSITION'; end if;
 else return NEW;
 end if;
 insert into public.matter_state_events(matter_id,new_state) values(NEW.id,NEW.status);
 return NEW;
end $$;
create trigger fixture_state_transition after insert or update of status on public.deals for each row execute function public.fixture_state_transition();`);
await db.exec(readFileSync('supabase/migrations/20261107215959_p3_domestic_execution.sql','utf8'));
const first=(await db.query(`select * from convert_sales_lead_to_matter('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001')`)).rows[0];
const repeat=(await db.query(`select * from convert_sales_lead_to_matter('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001')`)).rows[0];
if(first.matter_id!==repeat.matter_id || !repeat.duplicate) throw Error('Conversion not idempotent');
let denied=false;try {await db.query(`select * from convert_sales_lead_to_matter('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002')`)}catch(e){denied=e.code==='42501'}
if(!denied) throw Error('Client conversion authorized');
const matter=(await db.query('select * from deals where id=$1',[first.matter_id])).rows[0];
const truth={version:1,execution_method:'mobile',notarization_requirement:'required',notarial_act:'jurat',authentication_requirement:'not_required',signer_location:'Florida',execution_location:'Largo, Florida'};
const review={document_type:'Affidavit',destination_country:'United States',origin_state:'Florida',document_count:1,requested_deadline:'Not specified',document_reviewed:true,signer_reviewed:true,witness_reviewed:true,eligibility_reviewed:true,signer_count:1,witness_count:0,reason:'Controlled fixture document review'};
const args=[first.matter_id,matter.updated_at,JSON.stringify(truth),JSON.stringify(review),'00000000-0000-4000-8000-000000000001'];
const confirmed=(await db.query('select * from confirm_matter_execution_review($1,$2,$3,$4,$5)',args)).rows[0];
if(confirmed.matter.execution_truth.execution_method!=='mobile'||!confirmed.evidence_id||confirmed.matter.payment_confirmed!==false) throw Error('Invalid review transition');
let stale=false;try{await db.query('select * from confirm_matter_execution_review($1,$2,$3,$4,$5)',args)}catch(e){stale=e.code==='40001'}
if(!stale)throw Error('Stale overwrite accepted');
const stats=(await db.query('select (select count(*) from deals)::int as matters,(select count(*) from matter_evidence_ledger)::int as events')).rows[0];
console.log(JSON.stringify({conversion:'PASS',retry:'PASS',client_denied:'PASS',review:'PASS',stale_conflict:'PASS',...stats}));
const reviewed=(await db.query('select * from deals where id=$1',[first.matter_id])).rows[0];
const quote={ execution_truth:reviewed.execution_truth,total_price:750,final_total:750,original_total:750,
 amount_due:375,invoice_retainer:375,invoice_balance:375,invoice_subtotal:750,currency:'USD',quote_approved_by:'fixture',
 quote_breakdown:[{code:'matter_base',amount:750}],lane:'Signature',execution_tier:'Signature',base_price:750,witness_total:0,
 eligible_subtotal:750,non_discountable_total:0,matter_pricing_type:'signature',quote_execution_method:'in_person',pricing_version:'canonical-private-v2' };
const approved=(await db.query('select * from approve_reviewed_matter_quote($1,$2,$3,$4,$5)',[first.matter_id,reviewed.updated_at,JSON.stringify(quote),'00000000-0000-4000-8000-000000000001','{}'])).rows[0];
if(approved.matter.status!=='awaiting_payment'||approved.matter.payment_confirmed!==false) throw Error('Quote skipped canonical truth');
const states=(await db.query('select new_state from matter_state_events where matter_id=$1 order by created_at, id',[first.matter_id])).rows.map(x=>x.new_state);
for(const state of ['intake_received','under_review','quoted','awaiting_payment']) if(!states.includes(state)) throw Error('Missing canonical state '+state);
console.log('Private quote ordered canonical transitions: PASS');
// An evidence failure must roll back BOTH Matter creation and source linkage.
await db.exec(`insert into public.sales_leads select '00000000-0000-4000-8000-000000000004',full_name,email,phone,document_type,country,details,product_interest,lead_type,source_route,null,null,null from sales_leads limit 1;
create function public.fail_fixture_evidence() returns trigger language plpgsql as $$ begin raise exception 'fixture evidence unavailable'; end $$;
create trigger fail_fixture_evidence before insert on matter_evidence_ledger for each row execute function public.fail_fixture_evidence();`);
let rolledBack=false;
try { await db.query(`select * from convert_sales_lead_to_matter('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001')`); } catch { rolledBack=true; }
const afterFailure=(await db.query(`select (select count(*) from deals)::int as matters,(select canonical_matter_id from sales_leads where id='00000000-0000-4000-8000-000000000004') as link`)).rows[0];
if(!rolledBack || afterFailure.matters!==1 || afterFailure.link!==null) throw Error('Partial conversion escaped rollback');
console.log('Evidence failure rollback: PASS');
await db.close();
