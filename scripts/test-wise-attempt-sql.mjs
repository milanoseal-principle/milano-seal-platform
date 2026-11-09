// Actual PostgreSQL attempt authority; synthetic local data only, no providers.
import { migrationFixture } from './lib/migration-fixture.mjs';
import { evaluateExecutionGate, evaluateSchedulingGate } from '../lib/scheduling/complimentarySchedulingGate.ts';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const db = await migrationFixture();
const plan = JSON.parse(readFileSync('supabase/migration-replay-plan.json','utf8'));
const files = readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
for (const f of [...plan.fresh_database_prerequisites,...files.filter(f=>!plan.fresh_database_prerequisites.includes(f))]) await db.exec(readFileSync('supabase/migrations/'+f,'utf8'));
let checks=0;
const ok=(condition,label)=>{assert.ok(condition,label);checks++;};
const denied=async(fn,label,pattern)=>{await assert.rejects(fn,pattern,label);checks++;};
const client=randomUUID(),foreign=randomUUID();
await db.query("insert into auth.users(id,email) values($1,'attempt-owner@example.invalid'),($2,'foreign@example.invalid')",[client,foreign]);
const load=async id=>(await db.query('select * from deals where id=$1',[id])).rows[0];
const jsRow=row=>({...row,amount_due:Number(row.amount_due),amount_paid:Number(row.amount_paid),payment_observed_amount:Number(row.payment_observed_amount)});
const fixture=async()=>{
 const id=randomUUID(),ref='SYNTHETIC-'+id,url='https://wise.com/pay/synthetic-only';
 await db.query("insert into deals(id,deal_id,wise_reference,status,email,payment_status,payment_confirmed,amount_due,amount_paid,currency,payment_link) values($1,$2,$2,'intake_received','attempt-owner@example.invalid','unpaid',false,100,0,'USD',$3)",[id,ref,url]);
 await db.query("update deals set quote_approved_at=now(),quote_review_required=false,pricing_version='attempt-test',quote_breakdown='[{\"category\":\"base\",\"amount\":200}]',original_total=200,eligible_subtotal=200,non_discountable_total=0,discount_amount=0,final_total=200 where id=$1",[id]);
 for(const state of ['under_review','quoted','awaiting_payment'])await db.query('update deals set status=$1,deal_status=$1 where id=$2',[state,id]);
 return id;
};
const handoff=async id=>{
 const row=await load(id),hid=randomUUID();
 await db.query("insert into matter_evidence_ledger(id,matter_id,event_type,domain,actor_type,actor_id,source,metadata) values($1,$2,'WISE_PAYMENT_HANDOFF_OPENED','payment','client',$3,'portal-wise-payment-ritual',$4)",[hid,id,client,{amountDue:100,currency:'USD',wiseReference:row.wise_reference,paymentUrlFingerprint:createHash('sha256').update(row.payment_link).digest('hex')}]);
 return hid;
};
const begin=async(id,hid,actor=client)=>(await db.query('select begin_wise_payment_attempt($1,$2,$3) result',[id,hid,actor])).rows[0].result;
const observe=async(id,attempt,resource,status='IN_PROGRESS',overrides={})=>{
 const row=await load(id);
 const args={amount:100,currency:'USD',reference:row.wise_reference,time:new Date().toISOString(),source:'wise-activity',...overrides};
 return (await db.query('select record_wise_attempt_evidence($1,$2,$3,$4,$5,$6,$7,$8,$9) result',[id,attempt,resource,status,args.time,args.amount,args.currency,args.reference,args.source])).rows[0].result;
};
const confirm=async(id,resource)=>{const row=await load(id);return db.query("select confirm_wise_payment_for_deal($1,$2,$3,100,'USD','isolated-synthetic')",[id,row.wise_reference,resource]);};
const exec=async id=>db.query("update deals set status='in_execution',deal_status='in_execution' where id=$1",[id]);
const count=async id=>Number((await db.query("select count(*) n from matter_evidence_ledger where matter_id=$1",[id])).rows[0].n);
for(const terminal of ['CANCELLED','FAILED','EXPIRED','REVERSED','VOIDED','REFUNDED','REJECTED','REVOKED','SUPERSEDED']) {
 const id=await fixture(),hid=await handoff(id),attempt=await begin(id,hid),resource=randomUUID();
 ok(attempt.payment_attempt_id===hid,'attempt identity is the single-use governed handoff');
 const before=await count(id);await begin(id,hid);ok(await count(id)===before,'submission replay does not append or rotate');
 await db.query("update deals set status='scheduled',deal_status='scheduled' where id=$1",[id]);
 await denied(()=>exec(id),'client observation cannot execute',/WISE_PROVIDER_EVIDENCE_REQUIRED/);
 const eventTime=new Date().toISOString();
 await observe(id,hid,resource,'IN_PROGRESS',{time:eventTime});
 ok(evaluateExecutionGate(jsRow(await load(id))).schedulingEligible,'fresh positive evidence permits execution');
 const n=await count(id);await observe(id,hid,resource,'IN_PROGRESS',{time:eventTime});ok(await count(id)===n,'provider duplicate is idempotent');
 await observe(id,hid,resource,terminal);
 const cancelled=await load(id);ok(cancelled.wise_transaction_reference===null&&cancelled.payment_funding_method===null&&!cancelled.payment_confirmed,'invalidation clears provider authority');
 ok(!evaluateExecutionGate(jsRow(cancelled)).schedulingEligible,'TypeScript denies invalidation');
 await denied(()=>exec(id),'SQL denies invalidation',/WISE_PROVIDER_EVIDENCE_REQUIRED/);
 await denied(()=>observe(id,hid,resource,'IN_PROGRESS'),'out-of-order positive cannot revive terminal',/INVALIDATED/);
 await denied(()=>confirm(id,resource),'invalid resource cannot settle',/invalidated|settlement_required/);
 await denied(()=>begin(id,hid),'old handoff cannot be reused',/CONSUMED/);
 const newHandoff=await handoff(id),fresh=await begin(id,newHandoff);
 ok(fresh.payment_attempt_id!==hid&&fresh.wise_provider_evidence===null,'fresh submission rotates attempt and erases no history');
 ok(evaluateSchedulingGate({matter:jsRow(await load(id))}).schedulingEligible,'fresh client submission schedules only');
 await denied(()=>exec(id),'cancel then resubmit cannot execute with old fields',/WISE_PROVIDER_EVIDENCE_REQUIRED/);
 await denied(()=>observe(id,newHandoff,resource),'old resource cannot bind new attempt',/ALREADY_BOUND|INVALIDATED/);
 await denied(()=>observe(id,hid,randomUUID()),'in-flight old attempt cannot write new attempt',/CURRENT_ATTEMPT/);
 const freshResource=randomUUID();await observe(id,newHandoff,freshResource);
 ok(evaluateExecutionGate(jsRow(await load(id))).schedulingEligible,'genuinely fresh evidence succeeds');
 await exec(id);
 await denied(()=>db.query("update deals set status='in_transit',deal_status='in_transit' where id=$1",[id]),'unsettled provider evidence cannot release',/PAYMENT_REQUIRED/);
 await denied(()=>confirm(id,freshResource),'provider processing is never settlement',/settlement_required/);
 await observe(id,newHandoff,freshResource,'SETTLED',{source:'wise-statement'});await confirm(id,freshResource);await confirm(id,freshResource);
 ok((await load(id)).payment_settlement_status==='cleared','fresh statement settles once and retains progression');
}
const id=await fixture(),hid=await handoff(id);await denied(()=>begin(id,hid,foreign),'foreign client cannot submit',/OWNER/);await begin(id,hid);
for(const mismatch of [{amount:99},{amount:101},{currency:'EUR'},{reference:'FOREIGN'},{time:'2020-01-01T00:00:00Z'},{time:'2099-01-01T00:00:00Z'}]) {
 await denied(()=>observe(id,hid,randomUUID(),'IN_PROGRESS',mismatch),'provider scope/time mismatch denied',/MISMATCH|STALE/);
}
await denied(()=>observe(id,hid,randomUUID(),null),'null provider status denied',/INVALID_PROVIDER/);
await denied(()=>observe(id,hid,randomUUID(),'SETTLED',{source:null}),'null settlement source denied',/INVALID_PROVIDER/);
await denied(()=>observe(id,hid,randomUUID(),'IN_PROGRESS',{currency:null}),'null currency denied',/MISMATCH/);
await denied(()=>observe(id,hid,randomUUID(),'SETTLED'),'activity completion cannot claim settlement',/INVALID_PROVIDER/);
const resource=randomUUID();await observe(id,hid,resource);
const other=await fixture(),otherH=await handoff(other);await begin(other,otherH);
await denied(()=>observe(other,otherH,resource),'provider resource cannot authorize two Matters',/ALREADY_BOUND/);
await db.query("update deals set payment_status='failed' where id=$1",[id]);ok((await load(id)).wise_transaction_reference===null,'legacy failure writers also invalidate atomically');
await denied(()=>observe(id,hid,resource),'direct writer invalidation is sticky',/INVALIDATED/);
await db.exec('set role authenticated');
await denied(()=>db.query('select begin_wise_payment_attempt($1,$2,$3)',[id,hid,client]),'browser cannot call service attempt RPC',/permission denied/);
await denied(()=>db.query("select record_wise_attempt_evidence($1,$2,$3,'IN_PROGRESS',now(),100,'USD','SYNTHETIC')",[other,otherH,randomUUID()]),'browser cannot create provider evidence',/permission denied/);await db.exec('reset role');
await denied(()=>db.query("update matter_evidence_ledger set metadata='{}' where matter_id=$1",[id]),'attempt history immutable',/append-only/);
mkdirSync('artifacts/wise-attempt',{recursive:true});writeFileSync('artifacts/wise-attempt/database.json',JSON.stringify({status:'PASS',checks,environment:'ISOLATED_POSTGRESQL',migrations:files.length,hosted_certification:false},null,2));
console.log(`PASS ${checks} actual PostgreSQL Wise attempt checks.`);await db.close();
