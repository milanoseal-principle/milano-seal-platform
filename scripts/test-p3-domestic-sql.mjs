import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
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
// Apply the actual forward repair, including AFTER audit timing and append-only
// controls, rather than a substitute fixture trigger. No hosted certification.
await db.exec(readFileSync('supabase/migrations/20261107234218_p3_canonical_lifecycle_reconciliation.sql','utf8'));
await db.exec(`alter table public.deals add column payment_settlement_status text default 'unpaid';`);
await db.exec(readFileSync('supabase/migrations/089_verified_settlement_scheduling_gate.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/073_payment_observation_snapshot.sql','utf8'));
await db.exec('alter table public.deals add column wise_reference text,add column wise_transaction_reference text,add column payment_funding_method text;');
await db.exec(readFileSync('supabase/migrations/20261108220000_wise_authority_separation.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261107215959_p3_domestic_execution.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261109063000_verified_settlement_scheduling.sql','utf8'));
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
// Exhaustive parity against the actual TypeScript transition authority.
const compiled=ts.transpileModule(readFileSync('lib/stateMachine.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const stateMachine=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const statesToTest=[...stateMachine.CANONICAL_MATTER_STATES,'unknown',''];
for(const from of statesToTest) for(const to of statesToTest) {
 const actual=(await db.query('select public.is_valid_matter_transition($1,$2) as valid',[from,to])).rows[0].valid;
 assert.equal(actual,stateMachine.canTransition(from,to),`${from} -> ${to}`);
}
assert.equal((await db.query("select public.is_valid_matter_transition(null,null) as valid")).rows[0].valid,false);
console.log('SQL/TypeScript transition parity: PASS (196 pairs plus null)');
async function expectDenied(sql,params=[],code) {
 let rejected=false;try{await db.query(sql,params)}catch(e){rejected=code?e.code===code:true}
 assert.equal(rejected,true,sql);
}
await expectDenied("update deals set status='completed' where id=$1",[first.matter_id]);
assert.equal((await db.query('select status from deals where id=$1',[first.matter_id])).rows[0].status,'awaiting_payment');
await expectDenied("update deals set status='scheduled' where id=$1",[first.matter_id]);
await db.query("update deals set payment_confirmed=true,payment_status='paid',payment_settlement_status='cleared',amount_paid=374.99 where id=$1",[first.matter_id]);
assert.equal((await db.query('select status from deals where id=$1',[first.matter_id])).rows[0].status,'awaiting_payment');
await expectDenied("update deals set status='scheduled' where id=$1",[first.matter_id]);
// 089 mutates status on a payment-only update. The AFTER-all-updates trigger
// must record that final stage, although status was absent from the SET list.
await db.query("update deals set payment_confirmed=true,payment_status='paid',payment_settlement_status='cleared',amount_paid=375 where id=$1",[first.matter_id]);
assert.equal((await db.query('select status from deals where id=$1',[first.matter_id])).rows[0].status,'payment_confirmed');
assert.equal((await db.query("select count(*)::int as n from matter_state_events where matter_id=$1 and previous_state='awaiting_payment' and new_state='payment_confirmed'",[first.matter_id])).rows[0].n,1);
await expectDenied("update deals set status='in_execution' where id=$1",[first.matter_id],'23514');
await db.query("update deals set status='scheduled',deal_status='scheduled' where id=$1",[first.matter_id]);
await db.query("update deals set status='in_execution',deal_status='in_execution' where id=$1",[first.matter_id]);
const beforeNoop=(await db.query('select count(*)::int as n from matter_state_events')).rows[0].n;
await db.query("update deals set internal_notes='Metadata only' where id=$1",[first.matter_id]);
assert.equal((await db.query('select count(*)::int as n from matter_state_events')).rows[0].n,beforeNoop);
await expectDenied('update matter_state_events set reason=$1',['rewrite'],'42501');
await expectDenied('delete from matter_state_events',[],'42501');
for(const role of ['anon','authenticated']) {
 const privileges=(await db.query("select has_table_privilege($1,'public.matter_state_events','SELECT') as read,has_table_privilege($1,'public.matter_state_events','INSERT') as write,has_function_privilege($1,'public.enforce_canonical_matter_transition()','EXECUTE') as call",[role])).rows[0];
 assert.deepEqual(privileges,{read:false,write:false,call:false});
}
// A ledger insert failure must roll back the lifecycle change itself.
await db.exec(`create function public.fail_state_fixture() returns trigger language plpgsql as $$ begin raise exception 'state ledger unavailable'; end $$;
create trigger fail_state_fixture before insert on matter_state_events for each row execute function public.fail_state_fixture();`);
await expectDenied("update deals set status='in_transit',deal_status='in_transit' where id=$1",[first.matter_id]);
assert.equal((await db.query('select status from deals where id=$1',[first.matter_id])).rows[0].status,'in_execution');
await db.exec('drop trigger fail_state_fixture on matter_state_events;');
console.log('Settlement stage, skipped states, append-only roles, no-op and audit rollback: PASS');
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
