#!/usr/bin/env node
// Actual isolated database regression for the P1 no-authentication release
// deadlock. Synthetic Matter and no external provider/network operations.
// Executes canonical migrations and canonical Wise/release RPCs.
import {randomUUID,createHash} from 'node:crypto';
import {certificationRun,isolatedCanonicalDatabase,wiseFixtures} from './shared.mjs';

const run=certificationRun('P19_NO_AUTH');
const {report,check,assert}=run;
let db;
try {
 run.guard();
 db=await isolatedCanonicalDatabase(run.files);
 const f=await wiseFixtures(db);
 const operator=randomUUID();
 await db.query("insert into auth.users(id,raw_app_meta_data) values($1,'{\"role\":\"founder_admin\"}')",[operator]);
 const matter=await f.create();
 const load=async()=> (await db.query('select * from deals where id=$1',[matter])).rows[0];
 const state=async(status)=>db.query('update deals set status=$1,deal_status=$1 where id=$2',[status,matter]);
 const release=(actor,ids)=>db.query('select public.record_document_release($1,$2,$3) as receipt',[actor,matter,ids]);
 const digest=v=>createHash('sha256').update(v).digest('hex');
 const insert=async(stage,parent=null,hash=digest('test:'+randomUUID()))=>{
   const id=randomUUID(),storagePath='isolated-no-auth/'+id+'.pdf';
   await db.query('insert into document_versions(id,matter_id,stage,parent_version_id,file_hash,actor,source_file,storage_path) values($1,$2,$3,$4,$5,$6,$7,$7)',[id,matter,stage,parent,hash,operator,storagePath]);
   return id;
 };
 const approve=async(id)=>{
   const {rows}=await db.query('select file_hash from document_versions where id=$1',[id]);
   await db.query('select public.approve_document_version($1,$2,$3,$4)',[operator,id,rows[0].file_hash,'Synthetic isolated founder exact-version QC']);
 };
 const rejected=async(id,label,fn,pattern)=>{
   await check(id,label,async()=>{
     await db.exec('begin');
     try {await assert.rejects(fn,pattern);}
     finally {await db.exec('rollback');}
   });
 };
 await db.query("update deals set final_total=100,apostille_required=false,execution_truth=$1 where id=$2",[
  {version:1,notarization_requirement:'required',execution_method:'in_person',notarial_act:'acknowledgment',authentication_requirement:'not_required',execution_location:'FL',review_confirmed_by:operator},
  matter
 ]);
 await check('UNSETTLED','unsettled Matter cannot enter governed execution',async()=>{
   await assert.rejects(()=>state('scheduled'),/PAYMENT|SETTLEMENT|PAID|SCHEDUL/i);
 });
 const attempt=await f.begin(matter),resource=randomUUID();
 await f.observe(matter,attempt,resource,'SETTLED');
 await f.confirm(matter,resource);
 await f.schedule(matter);
 await state('in_execution');
 const executed=await insert('executed');await approve(executed);
 const final=await insert('final_packet',executed);await approve(final);
 await rejected('AUTH_REQUIRED','apostille-required Matter cannot release in_execution',async()=>{
    await db.query("update deals set apostille_required=true,execution_truth=jsonb_set(execution_truth,'{authentication_requirement}','\"apostille\"'::jsonb) where id=$1",[matter]);
    return release(operator,[final]);
 },/NO_AUTHENTICATION_ROUTE_REQUIRED|AUTHENTICATION/i);
 await rejected('UNKNOWN_AUTH','unknown authentication route cannot release',async()=>{
    await db.query("update deals set execution_truth=jsonb_set(execution_truth,'{authentication_requirement}','\"review_required\"'::jsonb) where id=$1",[matter]);
    return release(operator,[final]);
 },/NO_AUTHENTICATION_ROUTE_REQUIRED/);
 await rejected('BAD_ACTOR','unprivileged actor cannot release',()=>release(randomUUID(),[final]),/ACTOR|AUTH|OPERATOR|ROLE|GOVERNANCE/i);
 await rejected('WRONG_VERSION','wrong final version cannot release',()=>release(operator,[executed]),/COMPLETE_RELEASE_VERSION_SET_REQUIRED|RELEASE_VERSION_NOT_APPROVED/);
 await rejected('MISSING_VERSION','unknown final version cannot release',()=>release(operator,[randomUUID()]),/RELEASE_VERSION_NOT_APPROVED|COMPLETE_RELEASE_VERSION_SET_REQUIRED/);
 await rejected('INTEGRITY','version file hashes are immutable and cannot be forged',()=>db.query("update document_versions set file_hash=$1 where id=$2",['a'.repeat(64),final]),/IMMUTABLE/);
 await rejected('HOLD','open high severity incident freezes release',async()=>{
   await db.query("insert into compliance_incidents(matter_id,incident_type,severity,status,summary,release_frozen) values($1,'DOCUMENT_INTEGRITY','HIGH','OPEN','Synthetic blocker',true)",[matter]);
   return release(operator,[final]);
 },/RELEASE_FROZEN/);
 await check('PRE_RELEASE','transport cannot start before governed release evidence',async()=>{
   await assert.rejects(()=>state('in_transit'),/CURRENT_EXACT_DOCUMENT_RELEASE_REQUIRED/);
 });
 await check('EXACT_RELEASE','no-auth route can release approved executed/final lineage from in_execution',async()=>{
   const before=await load();assert.equal(before.status,'in_execution');assert.equal(before.apostille_required,false);
   const first=(await release(operator,[final])).rows[0].receipt;
   assert.ok(first);
   const second=(await release(operator,[final])).rows[0].receipt;
   assert.deepEqual(first,second);
   assert.equal((await load()).status,'in_execution');
   assert.equal((await load()).payment_status,'paid');
   assert.equal((await load()).payment_settlement_status,'cleared');
   const audit=await db.query("select count(*)::int n from custody_ledger where deal_id=$1 and event='DOC_RELEASE_CONFIRMED'",[matter]);
   assert.equal(audit.rows[0].n,1);
 });
 await check('IN_TRANSIT','governed release permits direct no-auth in_execution to in_transit',async()=>{
   await state('in_transit');
   assert.equal((await load()).status,'in_transit');
 });
 await check('DELIVERY_HOLD','release alone does not establish delivery or close',async()=>{
   await assert.rejects(()=>state('delivered'),/DELIVERY_CUSTODY_EVIDENCE_REQUIRED/);
   assert.equal((await load()).status,'in_transit');
 });
 await check('DELIVERY_CLOSE','delivery requires custody evidence before close',async()=>{
   await db.query('select append_custody_event($1,$2)',[{
      deal_id:matter,event:'DOC_DELIVERED',actor_type:'system',actor_id:operator,
      location:null,method:'ISOLATED_SIMULATION',status:'synthetic_delivery',
      notes:'No actual provider, courier or customer delivery',
      metadata:{live_delivery:false}
    },'P19-NO-AUTH-DELIVERY-'+matter]);
   await state('delivered');
   await state('completed');
   assert.equal((await load()).status,'completed');
 });
 report.matter_id=matter;report.route='NOTARIZATION_ONLY';report.status='PASS';
} catch(error){
 report.status='FAIL';
 if(!report.failures.length)report.failures.push({id:'HARNESS',message:String(error?.message??error).slice(0,240)});
 process.exitCode=1;console.error('P19 no-auth route FAILED: '+report.failures.at(-1).message);
} finally {
 report.completed_at=new Date().toISOString();
 await db?.close();
 run.save();
 console.log('P19 no-auth '+report.status+': '+report.checks.filter(x=>x.status==='PASS').length+' isolated checks; provider_live=false');
}
