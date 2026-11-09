import {execFileSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {migrationFixture} from '../lib/migration-fixture.mjs';
export function certificationRun(phase){
 const argument=process.argv.find(a=>a.startsWith('--mode='));const mode=(argument?.slice(7)??'SIMULATION').toUpperCase();
 const files=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
 const report={phase,run_id:randomUUID(),source_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),migration_head:files.at(-1),mode,live_certification:false,environment:'ISOLATED_PGLITE',checks:[],failures:[]};
 const save=()=>{mkdirSync('artifacts/certification',{recursive:true});writeFileSync(`artifacts/certification/${phase.toLowerCase()}-${mode === 'SIMULATION' ? 'simulation' : 'refused'}.json`,JSON.stringify(report,null,2)+'\n');};
 const check=async(id,label,fn)=>{try{await fn();report.checks.push({id,label,status:'PASS'});}catch(error){report.checks.push({id,label,status:'FAIL'});report.failures.push({id,message:String(error?.message??'CHECK_FAILED').slice(0,240)});throw error;}};
 const guard=()=>{if(process.argv.slice(2).length>1||process.argv.slice(2).some(arg=>!arg.startsWith('--mode=')))throw Error('CERTIFICATION_ARGUMENT_INVALID');if(mode!=='SIMULATION'){
  if(mode!=='CONTROLLED_LIVE')throw Error('CERTIFICATION_MODE_INVALID');
  if(process.env[`ALLOW_LIVE_${phase==='P20'?'WISE':phase==='P21'?'RON':phase==='P22'?'AUTHENTICATION':'RECOVERY'}_CERTIFICATION`]!=='true')throw Error('EXPLICIT_LIVE_AUTHORIZATION_REQUIRED');
  throw Error('CONTROLLED_LIVE_DISABLED_IN_SOURCE_PASS: provider/project/hostname binding and separate founder release are required');
 }};
 return {report,files,check,guard,save,assert};
}
export async function isolatedCanonicalDatabase(files){
 const db=await migrationFixture();try{const plan=JSON.parse(readFileSync('supabase/migration-replay-plan.json','utf8'));for(const file of [...plan.fresh_database_prerequisites,...files.filter(f=>!plan.fresh_database_prerequisites.includes(f))])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));return db;}catch(error){await db.close();throw error;}
}
export async function wiseFixtures(db){
 const actor=randomUUID();await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'certification-client@example.invalid','{\"role\":\"client\"}')",[actor]);
 const load=async id=>(await db.query('select * from deals where id=$1',[id])).rows[0];
 const js=row=>({...row,amount_due:Number(row.amount_due),amount_paid:Number(row.amount_paid),payment_observed_amount:row.payment_observed_amount==null?null:Number(row.payment_observed_amount)});
 const create=async()=>{const id=randomUUID(),reference='SIM-'+id;await db.query("insert into deals(id,deal_id,wise_reference,status,email,payment_status,payment_confirmed,amount_due,amount_paid,currency,payment_link) values($1,$2,$2,'intake_received','certification-client@example.invalid','unpaid',false,100,0,'USD','https://wise.com/pay/synthetic-certification-only')",[id,reference]);await db.query("update deals set quote_approved_at=now(),quote_review_required=false,pricing_version='SIMULATION',quote_breakdown='[{\"category\":\"base\",\"amount\":200}]',original_total=200,eligible_subtotal=200,non_discountable_total=0,discount_amount=0,final_total=200 where id=$1",[id]);for(const state of ['under_review','quoted','awaiting_payment'])await db.query('update deals set status=$1,deal_status=$1 where id=$2',[state,id]);return id;};
 const begin=async id=>{const row=await load(id),handoff=randomUUID();await db.query("insert into matter_evidence_ledger(id,matter_id,event_type,domain,actor_type,actor_id,source,metadata) values($1,$2,'WISE_PAYMENT_HANDOFF_OPENED','payment','client',$3,'portal-wise-payment-ritual',$4)",[handoff,id,actor,{amountDue:100,currency:'USD',wiseReference:row.wise_reference,paymentUrlFingerprint:createHash('sha256').update(row.payment_link).digest('hex')}]);const result=(await db.query('select begin_wise_payment_attempt($1,$2,$3) result',[id,handoff,actor])).rows[0].result;return result.payment_attempt_id;};
 const observe=async(id,attempt,resource,status='IN_PROGRESS',change={})=>{const row=await load(id),event={time:new Date().toISOString(),amount:100,currency:'USD',reference:row.wise_reference,source:status==='SETTLED'?'wise-statement':'wise-webhook',event_id:randomUUID(),...change};return db.query('select record_wise_attempt_evidence($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,attempt,resource,status,event.time,event.amount,event.currency,event.reference,event.source,event.event_id]);};
 const confirm=async(id,resource,change={})=>{const row=await load(id);return db.query('select confirm_wise_payment_for_deal($1,$2,$3,$4,$5,$6)',[id,change.reference??row.wise_reference,resource,change.amount??100,change.currency??'USD','P20_SIMULATION']);};
 const schedule=id=>db.query("update deals set status='scheduled',deal_status='scheduled' where id=$1",[id]);
 const ledgerCount=async id=>Number((await db.query('select count(*) n from matter_evidence_ledger where matter_id=$1',[id])).rows[0].n);
 return {actor,load,js,create,begin,observe,confirm,schedule,ledgerCount};
}
