import {randomUUID,createHash} from 'node:crypto';
import {buildRonEvidenceCommand,evaluateRonStatutoryEvidence} from '../../lib/ron/evidence.ts';
// Synthetic provider/actor/reference fixtures only. Canonical statutory and
// lifecycle SQL validates every transition; no provider/network calls occur.
export async function certifyRonOnMatter(db,matter,actor,run,sourceHash,executedBytes) {
 const {report,check,assert}=run,session=randomUUID(),signer=randomUUID(),version=randomUUID(),doc=randomUUID();
 const executedHash=createHash('sha256').update(executedBytes).digest('hex'),sha=executedHash;
 await db.query('insert into ron_sessions(id,matter_id,notarization_id,bn_session_id) values($1,$2,$3,$3)',[session,matter,'SIM-'+session]);
 const s={provider_name:'bluenotary',bn_session_id:'SIM-'+session,notary_name:'Synthetic Notary',notary_commission_number:'SIM-COMMISSION',notary_commission_jurisdiction:'FL',notary_commission_expires_on:'2030-01-01',notarial_act_type:'acknowledgment',notarial_act_count:1,certificate_completion_reference:'sim:certificate',electronic_signature_reference:'sim:signature',electronic_seal_reference:'sim:seal',execution_completed_at:'2026-11-08T12:00:00Z',journal_reference:'sim:journal',av_recording_reference:'sim:recording',retention_class:'RON_STATUTORY_EVIDENCE',retention_rule:'FL_RON_10Y',retention_start_at:'2026-11-08T12:00:00Z',provider_evidence_references:['sim:provider-evidence'],exception_status:'none',witness_requirement:'not_required',qc_status:'passed',qc_review_reference:'sim:qc'};
 const p={party_role:'principal',signer_reference:'sim:signer',signer_location_jurisdiction:'US-FL',signer_location_evidence_reference:'sim:location',identity_proofing_result:'passed',identity_proofing_reference:'sim:identity',credential_analysis_result:'passed',credential_analysis_reference:'sim:credential',kba_result:'passed',kba_reference:'sim:kba',awareness_willingness_confirmed_at:'2026-11-08T11:00:00Z',awareness_willingness_reference:'sim:awareness'};
 const update=async(table,id,fields)=>{const keys=Object.keys(fields);assert.ok(['ron_sessions','ron_signers','ron_documents','document_versions'].includes(table)&&keys.every(k=>/^[a-z0-9_]+$/.test(k)));await db.query(`update ${table} set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1}`,[...Object.values(fields).map(v=>Array.isArray(v)?JSON.stringify(v):v),id]);};
 await update('ron_sessions',session,s);
 await db.query('insert into ron_signers(id,ron_session_id,matter_id) values($1,$2,$3)',[signer,session,matter]);await update('ron_signers',signer,p);
 report.lifecycle_trace=['REQUESTED'];
 for(const state of ['PROVIDER_ACCEPTED','PROVIDER_SESSION_COMPLETED','EVIDENCE_PENDING']){await update('ron_sessions',session,{ron_lifecycle_state:state});report.lifecycle_trace.push(state);}
 const snapshot=async()=>JSON.parse(JSON.stringify({matterFound:true,executionTruth:{execution_method:'ron',notarial_act:'acknowledgment',ron_kba_status:'required'},session:(await db.query('select * from ron_sessions where id=$1',[session])).rows[0],signers:(await db.query('select * from ron_signers where ron_session_id=$1',[session])).rows,documents:(await db.query('select * from ron_documents where ron_session_id=$1',[session])).rows}));
 const command=async action=>{const result=buildRonEvidenceCommand(await snapshot(),action,actor,new Date().toISOString());if(result.missing.length)throw Error('RON_EVIDENCE_INCOMPLETE: '+result.missing.join(','));return update('ron_sessions',session,result.update);};
 const verify=()=>command('verify');

 await check('RON_MISSING_EVIDENCE','provider completion cannot establish Milano completion',async()=>{
  await assert.rejects(()=>update('ron_sessions',session,{ron_lifecycle_state:'COMPLETED'}),/INVALID_RON_LIFECYCLE_TRANSITION/);
  await assert.rejects(verify,/RON_EVIDENCE_INCOMPLETE/);
 });
 const source=randomUUID(),qc=randomUUID();
 await db.query("insert into execution_qa_reviews(id,deal_id,execution_qa_status,checklist_type,witness_status,passed_by,passed_at) values($1,$2,'PASSED','RON_QA','NOT_REQUIRED',$3,now())",[qc,matter,actor]);
 await db.query("update ron_sessions set blue_notary_status='COMPLETED',provider_completed_at=now() where id=$1",[session]);
 await db.query("insert into ron_documents(id,ron_session_id,matter_id,document_name,storage_bucket,storage_path,uploaded_to_bluenotary,submitted_sha256,submitted_storage_path) values($1,$2,$3,'source.pdf','deal-documents','simulation/source.pdf',true,$4,$5)",[source,session,matter,sourceHash,`ron/${matter}/${session}/source/${sourceHash}/source.pdf`]);
 const capturedId=(await db.query('select capture_ron_executed_document($1,$2,$3,$4,$5,$6) id',[session,source,sourceHash,executedHash,'executed.pdf',`ron/${matter}/${session}/executed/${executedHash}/executed.pdf`])).rows[0].id;
await db.query("update ron_documents set executed_sha256=signed_sha256,executed_document_version_id=executed_version_id,custody_ledger_hash=(select hash from custody_ledger where deal_id=$1 order by created_at desc limit 1) where id=$2",[matter,capturedId]);
const proof={status:'VERIFIED',reference:'fixture:proof'};
const evidence={provider_reference:'SIM-'+session,provider_evidence_reference:'fixture:provider',notary_identity_reference:'fixture:notary',commission_jurisdiction:'FL',commission_expires_at:'2027-01-01T10:00:00Z',act_count:1,qc_status:'PASSED',commission_reference:'fixture:commission',notarial_act:'acknowledgment',executed_at:'2026-01-01T10:00:00Z',certificate_reference:'fixture:certificate',seal_signature_reference:'fixture:seal',journal_reference:'fixture:journal',recording_reference:'fixture:recording',recording_retention_reference:'fixture:retention-policy',recording_retained_until:'2036-01-01T10:00:00Z',custody_reference:'fixture:custody',qc_reference:qc,signed_document_ids:[capturedId],signers:[{signer_id:signer,location_reference:'fixture:location',identity_proofing:proof,credential_analysis:proof,kba:proof,awareness:proof,willingness:proof,oath:proof}],witness_applicability:{status:'NOT_REQUIRED',basis_reference:'fixture:governed-witness-review'},witnesses:[]};

 const appendKey=randomUUID();let statutory;
 const append=async(expected=null,key=appendKey,body=evidence)=>(await db.query('select append_ron_statutory_evidence($1,$2,$3,$4,$5,$6) result',[session,actor,expected,key,body,'Controlled fixture statutory evidence review'])).rows[0].result;
 await check('STATUTORY_BOUNDARY','statutory append preserves lifecycle and retries exactly',async()=>{statutory=await append();assert.equal((await db.query('select ron_lifecycle_state,completed_at from ron_sessions where id=$1',[session])).rows[0].ron_lifecycle_state,'EVIDENCE_PENDING');assert.equal((await append()).evidence_id,statutory.evidence_id);});

 await check('RON_FROZEN','statutory evidence cannot be silently overwritten',async()=>{
  await assert.rejects(()=>db.query("update ron_audit_events set description='overwrite' where id=$1",[statutory.evidence_id]),/IMMUTABLE|APPEND|immutable/i);
 });
 const complete=async()=>{assert.deepEqual(evaluateRonStatutoryEvidence(await snapshot()),[]);await verify();await command('complete');};
 await check('RON_COMPLETE','verified exact statutory evidence permits Milano completion',complete);
 await check('RON_CORRECTION','reopened evidence blocks progression despite historical completion',async()=>{
  await db.query('select reopen_ron_statutory_evidence($1,$2,$3,$4)',[session,actor,statutory.evidence_id,'Synthetic correction preserving historical evidence']);
  await assert.rejects(()=>db.query("update deals set status='apostille_processing',deal_status='apostille_processing' where id=$1",[matter]),/RON_CURRENT_COMPLETION_AND_EVIDENCE_REQUIRED|RON_COMPLETION_REQUIRED_BEFORE_EXECUTION_EXIT/);
  await assert.rejects(()=>update('ron_sessions',session,{av_recording_reference:null}),/FROZEN/);
  await assert.rejects(()=>update('ron_sessions',session,{completed_at:null}),/FROZEN/);
  const corrected={...evidence,journal_reference:'simulation:corrected-journal'};
  await append(statutory.evidence_id,randomUUID(),corrected);await complete();
 });
 const captured=(await db.query('select executed_version_id,signed_storage_path from ron_documents where id=$1',[capturedId])).rows[0];
 return {session,executedVersion:captured.executed_version_id,path:captured.signed_storage_path,hash:executedHash};
}
