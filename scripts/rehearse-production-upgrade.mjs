#!/usr/bin/env node
// Isolated metadata-based upgrade rehearsal. This script has no hosted write or
// provider transport. Production backups and release authorization stay separate.
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {uuid_ossp} from '@electric-sql/pglite/contrib/uuid_ossp';
import {hostedSchemaFixture,applicationCatalog,readCatalog,baselineMetadata} from './lib/hosted-schema-fixture.mjs';
import {wiseFixtures,syntheticIdentifierLock} from './certification/shared.mjs';
import {REQUIRED_SCHEMA,REQUIRED_RPCS} from './verify-production-schema-capabilities.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const plan=JSON.parse(readFileSync('supabase/migration-replay-plan.json')).hosted_recovery;
const report={source_sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'ISOLATED_HOSTED_SCHEMA_REHEARSAL',project_ref:plan.project_ref,production_backup_status:'BACKUP_UNVERIFIED',production_write_authorized:false,hosted_mutations:false,customer_rows_copied:0,live_certification:false,checks:[],failures:[],migrations:[]};
let db,restored;
const check=async(id,label,fn)=>{try{await fn();report.checks.push({id,label,status:'PASS'});}catch(error){report.checks.push({id,label,status:'FAIL'});throw error;}};
const row=async(database,table,id)=>(await database.query(`select to_jsonb(t) value from public.${table} t where id=$1`,[id])).rows[0].value;
const preserve=(before,after)=>assert.deepEqual(Object.fromEntries(Object.keys(before).map(key=>[key,after[key]])),before,'Original columns, IDs, statuses and history must remain unchanged');
const privateTables=['custody_ledger','identifier_locks','matter_evidence_ledger','messages','notifications','ron_audit_events','ron_documents','ron_sessions','ron_signers','ron_webhook_events'];
try{
 assert.equal(process.argv.length,4,'Usage: node scripts/rehearse-production-upgrade.mjs --snapshot /private/schema-snapshot.json');assert.equal(process.argv[2],'--snapshot');
 const snapshot=JSON.parse(readFileSync(process.argv[3]));
 await check('TARGET','exact inspected project and ledger baseline',async()=>{assert.equal(snapshot.project_ref,plan.project_ref);assert.equal(snapshot.customer_rows_copied,0);assert.equal(sha(JSON.stringify(baselineMetadata(snapshot))),plan.baseline_metadata_sha256,'Inspected baseline drift requires a new review');assert.equal(snapshot.migrations.length,plan.observed_migration_count);assert.equal(snapshot.migrations.at(-1).version,plan.observed_last_migration);for(const file of plan.dependency_order)assert.equal(sha(readFileSync('supabase/migrations/'+file)),plan.file_sha256[file],file+' changed since release-plan review');assert.ok(!plan.dependency_order.includes('20261108180000_operator_authority_prerequisite.sql'));});
 await check('BASELINE','reconstruct exact public metadata and inspected storage policies',async()=>{db=await hostedSchemaFixture(snapshot);report.baseline_catalog_sha256=sha(JSON.stringify(applicationCatalog(await readCatalog(db))));report.baseline_counts=Object.fromEntries(Object.entries(applicationCatalog(snapshot.catalog)).map(([key,values])=>[key,values.length]));});
 await check('REPRODUCE_HASH_FAILURE','hosted extension placement reproduces broken identifier helper',async()=>{await assert.rejects(()=>db.query("select public.ms_sha256_text('noncustomer-probe')"),/digest/);});
 const operatorFingerprint=(await db.query("select md5(pg_get_functiondef('public.is_operator()'::regprocedure)) hash")).rows[0].hash;
 const fixture=await wiseFixtures(db),pending=await fixture.create(),intake=randomUUID();
 await db.query("update deals set payment_status='pending' where id=$1",[pending]);
 await db.query("insert into deals(id,deal_id,email,client_name,status,payment_status,payment_confirmed,amount_due,amount_paid,currency) values($1,$2,'preservation-owner@example.invalid','Preservation Owner','intake_received','unpaid',false,100,0,'USD')",[intake,'PRESERVE-'+intake]);
 const notifications=[];for(const state of ['failed','provider_accepted']){const id=randomUUID();await db.query("insert into notifications(id,deal_id,recipient_email,channel,type,subject,message,status,delivery_status) values($1,$2,'preservation-owner@example.invalid','email','recovery_preservation','Preserved notification','No provider transmission',$3,$3)",[id,pending,state]);notifications.push(id);}
 const custody=[];let parent='GENESIS';for(let i=0;i<3;i++){const id=randomUUID(),hash=sha('preserved-custody-'+id);await db.query("insert into custody_ledger(id,deal_id,event,actor_type,actor_id,prev_hash,hash,metadata) values($1,$2,'DOC_RECEIVED','system','isolated-preservation',$3,$4,'{}')",[id,pending,parent,hash]);custody.push(id);parent=hash;}
 const preserved=[];for(const [table,ids] of [['deals',[pending,intake]],['notifications',notifications],['custody_ledger',custody]])for(const id of ids)preserved.push({table,id,before:await row(db,table,id)});
 const revoked=randomUUID();await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'revoked@example.invalid','{\"role\":\"operator\"}')",[revoked]);await db.query("insert into operators(user_id,email,role,is_active) values($1,'revoked@example.invalid','operator',false)",[revoked]);
 const revokedAuthority=async(database)=>{await database.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:revoked,role:'authenticated'})]);assert.equal((await database.query('select public.is_operator() allowed')).rows[0].allowed,false);await database.query("select set_config('request.jwt.claims','{}',false)");};
 await check('PRECONDITIONS','nonempty unpaid/history fixtures and revoked operator denial',async()=>{assert.equal(preserved.length,7);await revokedAuthority(db);assert.equal((await db.query("select has_table_privilege('authenticated','public.custody_ledger','TRUNCATE') allowed")).rows[0].allowed,true);});
 const backup=await db.dumpDataDir();report.isolated_pre_upgrade_archive_sha256=sha(Buffer.from(await backup.arrayBuffer()));
 await check('UPGRADE','apply only reviewed prerequisite and pending SQL files',async()=>{for(const file of plan.dependency_order){await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));report.migrations.push({file,sha256:plan.file_sha256[file],status:'PASS'});}});
 await check('PRESERVATION','preserve all original Matter, delivery and custody values',async()=>{for(const record of preserved)preserve(record.before,await row(db,record.table,record.id));assert.equal((await row(db,'notifications',notifications[1])).delivery_status,'provider_accepted');assert.equal((await row(db,'notifications',notifications[1])).delivered_at,null);});
 await check('EXTENSION_HASH','native helper matches SHA-256 over empty, Unicode and newline bytes',async()=>{for(const value of [null,'','identifier-123','Àlfa Ω','emoji 🦭','line one\nline two'])assert.equal((await db.query('select public.ms_sha256_text($1) value',[value])).rows[0].value,sha(value??''));});
 await check('ROLE_REVOCATION','preserve hosted authority definition and inactive operator denial',async()=>{assert.equal((await db.query("select md5(pg_get_functiondef('public.is_operator()'::regprocedure)) hash")).rows[0].hash,operatorFingerprint);await revokedAuthority(db);});
 await check('PRIVATE_HISTORY','deny inherited maintenance privileges without changing record history',async()=>{for(const role of ['anon','authenticated'])for(const table of privateTables)for(const privilege of ['TRUNCATE','REFERENCES','TRIGGER'])assert.equal((await db.query('select has_table_privilege($1,$2,$3) allowed',[role,'public.'+table,privilege])).rows[0].allowed,false,role+' '+table+' '+privilege);await db.exec('set role authenticated');try{await assert.rejects(()=>db.exec('truncate public.custody_ledger'),/permission denied/);}finally{await db.exec('reset role');}for(const id of custody)preserve(preserved.find(r=>r.id===id).before,await row(db,'custody_ledger',id));});
 await check('CAPABILITIES','actual migrated columns/RPCs satisfy original build capability contract',async()=>{const catalog=await readCatalog(db);for(const [table,columns] of Object.entries(REQUIRED_SCHEMA))for(const column of columns)assert.ok(catalog.columns.some(c=>c.key==='public.'+table+'.'+column),table+'.'+column);for(const rpc of REQUIRED_RPCS)assert.ok(catalog.functions.some(f=>f.key.startsWith('public.'+rpc+'(')),rpc);});
 await check('WISE_AUTHORITY','real upgraded attempt RPC blocks submission and unlocks only exact settlement',async()=>{const attempt=await fixture.begin(pending),resource=randomUUID();await assert.rejects(()=>fixture.schedule(pending),/SETTLEMENT|PAYMENT|TRANSITION/i);await fixture.observe(pending,attempt,resource,'IN_PROGRESS');await assert.rejects(()=>fixture.schedule(pending),/SETTLEMENT|PAYMENT|TRANSITION/i);await fixture.observe(pending,attempt,resource,'SETTLED');await fixture.confirm(pending,resource);await fixture.schedule(pending);assert.equal((await fixture.load(pending)).payment_confirmed,true);});
 await check('NO_AUTH_RELEASE','upgraded canonical RPC permits only exact no-auth release and idempotent replay',async()=>{
  const id=await fixture.create(),actor=randomUUID();
  await db.query("insert into auth.users(id,raw_app_meta_data) values($1,'{\"role\":\"founder_admin\"}')",[actor]);
  await db.query("update deals set final_total=100,apostille_required=false,execution_truth=$1 where id=$2",[{notarization_requirement:'required',execution_method:'in_person',authentication_requirement:'not_required',review_confirmed_by:actor},id]);
  const attempt=await fixture.begin(id),resource=randomUUID();await fixture.observe(id,attempt,resource,'SETTLED');await fixture.confirm(id,resource);await fixture.schedule(id);await db.query("update deals set status='in_execution',deal_status='in_execution' where id=$1",[id]);
  const executed=randomUUID(),final=randomUUID();
  for(const [version,stage,parent] of [[executed,'executed',null],[final,'final_packet',executed]]){
   const hash=sha('Synthetic upgraded '+version);
   await db.query("insert into document_versions(id,matter_id,stage,parent_version_id,file_hash,actor,source_file,storage_path) values($1,$2,$3,$4,$5,$6,$7,$7)",[version,id,stage,parent,hash,actor,'simulation/'+version+'.pdf']);
   await db.query('select approve_document_version($1,$2,$3,$4)',[actor,version,hash,'Synthetic exact-version upgraded release review']);
  }
  const release=async()=>(await db.query('select record_document_release($1,$2,$3) result',[actor,id,[final]])).rows[0].result;
  const deny=async()=>{await db.exec('savepoint denied_release');try{await assert.rejects(release,/IDENTIFIER_LOCK_REQUIRED/);}finally{await db.exec('rollback to denied_release;release savepoint denied_release');}};
  await db.exec('begin');try{await db.query("update deals set destination_country='Italy' where id=$1",[id]);await deny();const lock=await syntheticIdentifierLock(db,id,actor,'needs_review');await deny();await db.query("update identifier_locks set status='confirmed' where id=$1",[lock]);assert.ok((await release()).hash);}finally{await db.exec('rollback');}
  for(const requirement of ['authentication_legalization','review_required']){await db.exec('begin');try{await db.query("update deals set execution_truth=jsonb_set(execution_truth,'{authentication_requirement}',to_jsonb($1::text)),status='apostille_processing',deal_status='apostille_processing' where id=$2",[requirement,id]);await assert.rejects(release,requirement==='review_required'?/AUTHENTICATION_ROUTE_REVIEW_REQUIRED/:/APPROVED_AUTHENTICATION_VERSION_REQUIRED|VERIFIED_AUTHORITY_RETURN_LINEAGE_REQUIRED/);}finally{await db.exec('rollback');}}
  await db.exec('begin');try{
   await db.query("update deals set status='apostille_processing',deal_status='apostille_processing' where id=$1",[id]);
   const orphan=randomUUID(),hash=sha('Synthetic unexecuted final packet');
   await db.query("insert into document_versions(id,matter_id,stage,file_hash,actor,source_file) values($1,$2,'final_packet',$3,$4,'simulation/unexecuted.pdf')",[orphan,id,hash,actor]);
   await db.query('select approve_document_version($1,$2,$3,$4)',[actor,orphan,hash,'Synthetic negative exact-final QC']);
   await assert.rejects(()=>db.query('select record_document_release($1,$2,$3)',[actor,id,[final,orphan]]),/VERIFIED_EXECUTED_VERSION_REQUIRED/);
  }finally{await db.exec('rollback');}
  const first=await release(),second=await release();assert.equal(first.hash,second.hash);assert.equal(second.duplicate,true);
  assert.equal((await fixture.load(id)).status,'in_execution');
  assert.equal((await db.query("select count(*)::int n from custody_ledger where deal_id=$1 and event='DOC_RELEASE_CONFIRMED'",[id])).rows[0].n,1);
  await db.query("update deals set status='in_transit',deal_status='in_transit' where id=$1",[id]);
 });
 await check('GOVERNANCE_PAUSED','installation never activates agents or corporate execution',async()=>{const settings=(await db.query('select * from governance_settings')).rows[0];assert.equal(settings.paused,true);assert.equal(settings.mode,'DISABLED');assert.equal(Number((await db.query('select count(*) n from governance_agents where enabled')).rows[0].n),0);});
 await check('PHYSICAL_RESTORE','physical restore returns original schema and all non-customer history',async()=>{restored=new PGlite({loadDataDir:backup,extensions:{pgcrypto,uuid_ossp}});await restored.waitReady;for(const record of preserved)assert.deepEqual(await row(restored,record.table,record.id),record.before);assert.equal((await restored.query("select to_regclass('public.governance_settings') value")).rows[0].value,null);await revokedAuthority(restored);assert.deepEqual(applicationCatalog(await readCatalog(restored)),applicationCatalog(snapshot.catalog));});
 report.status='PASS';report.migration_count=report.migrations.length;report.production_schema_aligned=false;report.production_backup_recoverability_verified=false;
}catch(error){report.status='FAIL';report.failures.push({message:String(error.message).slice(0,500),code:error.code});process.exitCode=1;console.error('Recovery rehearsal failed: '+report.failures[0].message);}finally{await db?.close();await restored?.close();mkdirSync('artifacts/production-recovery',{recursive:true});writeFileSync('artifacts/production-recovery/rehearsal.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks.filter(c=>c.status==='PASS').length,migrations:report.migrations.length,production_backup_status:report.production_backup_status,hosted_mutations:false}));}
