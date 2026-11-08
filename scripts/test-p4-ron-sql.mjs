// Isolated actual-migration regression; no hosted records or statutory facts.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create table auth.users(id uuid primary key,raw_app_meta_data jsonb,banned_until timestamptz);
create function auth.uid() returns uuid language sql as $$select null::uuid$$;
create function auth.jwt() returns jsonb language sql as $$select '{}'::jsonb$$;
create function auth.email() returns text language sql as $$select ''::text$$;
create table public.deals(id uuid primary key,email text,execution_truth jsonb,witnesses int default 0,status text,deal_status text);
grant usage on schema public to anon,authenticated,service_role;`);
for(const name of ['025_execution_qa_and_witness_network.sql','034_compliance_incidents.sql','037_identifier_lock_document_versions.sql','062_bluenotary_ron_production_reconciliation.sql','063_ron_document_storage_bucket.sql','083_ron_provider_capability_evidence.sql'])await db.exec(readFileSync('supabase/migrations/'+name,'utf8'));
await db.exec(`alter table public.compliance_incidents add column if not exists matter_id uuid, add column if not exists release_frozen boolean not null default true, add column if not exists summary text;`);
await db.exec(readFileSync('supabase/migrations/20261108041000_ron_incident_enum_extensions.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261108042000_p4_ron_statutory_evidence.sql','utf8'));
const actor='00000000-0000-4000-8000-000000000001',client='00000000-0000-4000-8000-000000000002',matter='00000000-0000-4000-8000-000000000003',session='00000000-0000-4000-8000-000000000004',signer='00000000-0000-4000-8000-000000000005';
await db.query(`insert into auth.users values ($1,'{"role":"admin_operator"}',null),($2,'{"role":"client"}',null)`,[actor,client]);
await db.query(`insert into deals values($1,'fixture@example.invalid','{"execution_method":"ron","notarial_act":"jurat","notary_jurisdiction":"FL","ron_kba_status":"required","ron_credential_analysis_status":"required"}',0,'in_execution','in_execution')`,[matter]);
await db.query(`insert into ron_sessions(id,matter_id,notarization_id,bn_session_id,blue_notary_status,provider_completed_at,milano_ron_status) values($1,$2,'fixture-notarization','provider-session','COMPLETED',now(),'SESSION_PROCESSING')`,[session,matter]);
await db.query(`insert into ron_signers(id,ron_session_id,matter_id) values($1,$2,$3)`,[signer,session,matter]);
const source=crypto.randomUUID(),qc=crypto.randomUUID();
await db.query(`insert into execution_qa_reviews(id,deal_id,execution_qa_status,checklist_type,passed_by,passed_at) values($1,$2,'PASSED','RON_QA',$3,now())`,[qc,matter,actor]);
await db.query(`insert into ron_documents(id,ron_session_id,matter_id,document_name,storage_bucket,storage_path,uploaded_to_bluenotary,submitted_sha256,submitted_storage_path) values($1,$2,$3,'source.pdf','deal-documents','fixture-source.pdf',true,$4,$5)`,[source,session,matter,'c'.repeat(64),`ron/${matter}/${session}/source/${'c'.repeat(64)}/source.pdf`]);
const capture=async(hash='a'.repeat(64))=>(await db.query('select public.capture_ron_executed_document($1,$2,$3,$4,$5,$6) as id',[session,source,'c'.repeat(64),hash,'executed.pdf',`ron/${matter}/${session}/executed/${hash}/executed.pdf`])).rows[0].id;
const capturedId=await capture();
assert.equal(await capture(),capturedId);
const proof={status:'VERIFIED',reference:'fixture:proof'};
const evidence={provider_reference:'provider-session',provider_evidence_reference:'fixture:provider',notary_identity_reference:'fixture:notary',commission_jurisdiction:'FL',commission_expires_at:'2027-01-01T10:00:00Z',act_count:1,qc_status:'PASSED',commission_reference:'fixture:commission',notarial_act:'jurat',executed_at:'2026-01-01T10:00:00Z',certificate_reference:'fixture:certificate',seal_signature_reference:'fixture:seal',journal_reference:'fixture:journal',recording_reference:'fixture:recording',recording_retention_reference:'fixture:retention-policy',recording_retained_until:'2036-01-01T10:00:00Z',custody_reference:'fixture:custody',qc_reference:qc,signed_document_ids:[capturedId],signers:[{signer_id:signer,location_reference:'fixture:location',identity_proofing:proof,credential_analysis:proof,kba:proof,awareness:proof,willingness:proof,oath:proof}],witness_applicability:{status:'NOT_REQUIRED',basis_reference:'fixture:governed-witness-review'},witnesses:[]};
let passed=0;
async function denied(fn,label){let error;try{await fn()}catch(e){error=e}assert.ok(error,label);passed++;}
async function append(body=evidence,actorId=actor,expected=null,key=crypto.randomUUID(),reason='Controlled fixture evidence review'){
 return (await db.query('select public.append_ron_statutory_evidence($1,$2,$3,$4,$5,$6) as result',[session,actorId,expected,key,JSON.stringify(body),reason])).rows[0].result;
}
await denied(()=>db.query("update ron_sessions set milano_ron_status='RON_COMPLETED' where id=$1",[session]),'generic provider completion cannot complete execution');
await denied(()=>db.query("update deals set status='in_transit' where id=$1",[matter]),'RON corridor fails closed');
await denied(()=>append(evidence,client),'client actor rejected');
for(const field of ['recording_reference','journal_reference','commission_reference','certificate_reference','seal_signature_reference','qc_reference','custody_reference','witness_applicability']){
 const value=structuredClone(evidence);delete value[field];await denied(()=>append(value),'missing '+field);
}
for(const field of ['identity_proofing','credential_analysis','kba','awareness','willingness','oath']){
 const value=structuredClone(evidence);delete value.signers[0][field];await denied(()=>append(value),'missing signer '+field);
}
let value=structuredClone(evidence);value.signers[0].kba={status:'NOT_REQUIRED',basis_reference:'fixture:policy'};await denied(()=>append(value),'required KBA not waived');
value=structuredClone(evidence);value.signed_document_ids=[crypto.randomUUID()];await denied(()=>append(value),'cross session document denied');
value=structuredClone(evidence);value.signers[0].signer_id=crypto.randomUUID();await denied(()=>append(value),'cross session signer denied');
value=structuredClone(evidence);value.raw_passport='private';await denied(()=>append(value),'extra identity content denied');
value=structuredClone(evidence);value.recording_reference='https://example.invalid/file?token=secret';await denied(()=>append(value),'signed URL denied');
value=structuredClone(evidence);value.provider_reference='other-session';await denied(()=>append(value),'wrong provider session denied');
await db.query('update ron_sessions set provider_completed_at=null where id=$1',[session]);await denied(()=>append(),'no provider completion');await db.query('update ron_sessions set provider_completed_at=now() where id=$1',[session]);
for (const change of [{recording_retained_until:'2027-01-01T10:00:00Z'},{commission_jurisdiction:'OTHER'},{qc_status:'PENDING'},{commission_expires_at:'2025-01-01T00:00:00Z'},{act_count:0},{external_provider_fee:{classification:'MILANO_REVENUE',reference:'fixture:fee'}},{external_provider_fee:{classification:'EXTERNAL_PROVIDER_NOTARIAL_FEE',reference:'fixture:fee',amount:25}}]) await denied(()=>append({...evidence,...change}),'statutory/provider fee boundaries');
await db.query('update deals set witnesses=null where id=$1',[matter]);await denied(()=>append(),'unknown witness applicability');await db.query('update deals set witnesses=0 where id=$1',[matter]);
await db.query("update execution_qa_reviews set execution_qa_status='BLOCKED' where id=$1",[qc]);await denied(()=>append(),'canonical QC blocked');await db.query("update execution_qa_reviews set execution_qa_status='PASSED' where id=$1",[qc]);
await db.query("insert into compliance_incidents(matter_id,incident_type,severity,status,summary,release_frozen) values($1,'FIXTURE','critical','OPEN','Controlled fixture blocker',true)",[matter]);await denied(()=>append(),'blocking incident');await db.query("update compliance_incidents set status='CLOSED' where matter_id=$1",[matter]);
await denied(()=>db.query("update ron_documents set submitted_sha256=$1 where id=$2",['d'.repeat(64),source]),'submitted source immutable');
const key=crypto.randomUUID();const first=await append(evidence,actor,null,key);const again=await append(evidence,actor,null,key);assert.equal(first.evidence_id,again.evidence_id);assert.equal(again.duplicate,true);passed++;
assert.equal((await db.query('select milano_ron_status from ron_sessions where id=$1',[session])).rows[0].milano_ron_status,'RON_COMPLETED');passed++;
await denied(()=>append({...evidence,journal_reference:'fixture:other'},actor,null,key),'same key different facts rejected');
await denied(()=>append(evidence,actor,null),'stale correction rejected');
await denied(()=>append(evidence,actor,first.evidence_id,crypto.randomUUID(),'Corrected governed evidence reference'),'locked evidence requires authorized reopen');
await denied(()=>db.query('select public.reopen_ron_statutory_evidence($1,$2,$3,$4)',[session,client,first.evidence_id,'Controlled reopen review']),'client cannot reopen');
await db.query('select public.reopen_ron_statutory_evidence($1,$2,$3,$4)',[session,actor,first.evidence_id,'Controlled reopen review']);
assert.equal((await db.query('select public.ron_statutory_evidence_verified($1) as verified',[session])).rows[0].verified,false);passed++;
const correction=await append(evidence,actor,first.evidence_id,crypto.randomUUID(),'Corrected governed evidence reference');
assert.notEqual(correction.evidence_id,first.evidence_id);assert.equal((await db.query('select supersedes_event_id from ron_audit_events where id=$1',[correction.evidence_id])).rows[0].supersedes_event_id,first.evidence_id);passed++;
await denied(()=>db.exec("update document_versions set file_hash='rewritten'"),'canonical lineage hash immutable');
await denied(()=>db.exec("delete from document_versions"),'canonical lineage cannot delete');
await denied(()=>db.exec("update ron_audit_events set description='rewritten'"),'history immutable');
await denied(()=>db.exec('delete from ron_audit_events'),'history cannot delete');
await denied(()=>db.query("update ron_documents set signed_sha256=$1 where id=$2",['b'.repeat(64),capturedId]),'executed hash immutable');
await denied(()=>db.query("update ron_documents set signed_storage_path='other' where id=$1",[document]),'executed version immutable');
await db.query("update deals set status='in_transit' where id=$1",[matter]);passed++;
const changedId=await capture('b'.repeat(64));assert.notEqual(changedId,capturedId);passed++;
assert.equal((await db.query('select public.ron_statutory_evidence_verified($1) as verified',[session])).rows[0].verified,false);passed++;
assert.equal((await db.query("select count(*)::int as n from compliance_incidents where incident_type='RON_EXECUTED_BYTES_CHANGED' and status='INCIDENT_OPENED' and release_frozen")).rows[0].n,1);passed++;
await capture('b'.repeat(64));assert.equal((await db.query("select count(*)::int as n from compliance_incidents where incident_type='RON_EXECUTED_BYTES_CHANGED'")).rows[0].n,1);passed++;
await denied(()=>db.query("update deals set status='delivered' where id=$1",[matter]),'changed output blocks progression');
await db.exec('set role authenticated');
await denied(()=>append(evidence,actor,correction.evidence_id),'authenticated cannot invoke privileged RPC');
assert.equal((await db.query('select * from ron_audit_events')).rows.length,0);passed++;
await denied(()=>db.query("insert into ron_audit_events(event_type) values('forged')"),'client cannot append');
await db.exec('reset role');
await db.query(`insert into deals values($1,'nonron@example.invalid','{"execution_method":"in_person"}',0,'in_execution','in_execution')`,[client]);
await db.query("update deals set status='in_transit' where id=$1",[client]);passed++;
console.log(`PASS ${passed} P4 actual-migration checks. Isolated PostgreSQL; no hosted/provider certification.`);
await db.close();
