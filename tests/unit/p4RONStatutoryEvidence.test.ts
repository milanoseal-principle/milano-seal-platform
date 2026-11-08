import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ronStatutoryEvidenceSchema } from '@/lib/bluenotary/statutoryEvidence';
import { mapBNEventToMilanoStatus } from '@/lib/bluenotary/status';
import { computeEventHash } from '@/lib/bluenotary/webhook';
import { portalRONProjection } from '@/lib/bluenotary/projection';
import type { RONSession } from '@/lib/bluenotary/types';
const id='00000000-0000-4000-8000-000000000001';
const proof={status:'VERIFIED',reference:'provider:proof'};
const evidence={provider_reference:'provider-session',provider_evidence_reference:'provider:event',notary_identity_reference:'notary:identity',commission_jurisdiction:'FL',commission_expires_at:'2027-01-01T10:00:00Z',act_count:1,qc_status:'PASSED',commission_reference:'commission:record',notarial_act:'jurat',executed_at:'2026-01-01T10:00:00Z',certificate_reference:'provider:certificate',seal_signature_reference:'provider:seal',journal_reference:'provider:journal',recording_reference:'provider:recording',recording_retention_reference:'policy:recording',recording_retained_until:'2036-01-01T10:00:00Z',custody_reference:'custody:event',qc_reference:'qc:record',signed_document_ids:[id],signers:[{signer_id:id,location_reference:'signer:jurisdiction',identity_proofing:proof,credential_analysis:proof,kba:proof,awareness:proof,willingness:proof,oath:proof}],witnesses:[]};

test('complete evidence is structured references, not a provider success flag',()=>assert.equal(ronStatutoryEvidenceSchema.safeParse(evidence).success,true));
for(const field of ['journal_reference','recording_reference','recording_retention_reference','commission_reference','certificate_reference','seal_signature_reference','qc_reference','custody_reference']) test(`missing ${field} cannot verify execution`,()=>{
 const value:Record<string,unknown>={...evidence};delete value[field];assert.equal(ronStatutoryEvidenceSchema.safeParse(value).success,false);
});
for(const field of ['identity_proofing','credential_analysis','kba','awareness','willingness','oath'])test(`missing signer ${field} cannot verify execution`,()=>{
 const value=structuredClone(evidence);delete (value.signers[0] as Record<string,unknown>)[field];assert.equal(ronStatutoryEvidenceSchema.safeParse(value).success,false);
});
test('jurat cannot waive oath evidence',()=>{
 const value={...evidence,signers:[{...evidence.signers[0],oath:{status:'NOT_REQUIRED',basis_reference:'policy:other'}}]};assert.equal(ronStatutoryEvidenceSchema.safeParse(value).success,false);
});
test('duplicate signer or document identity is not a complete roster',()=>{
 assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,signers:[...evidence.signers,...evidence.signers]}).success,false);
 assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,signed_document_ids:[id,id]}).success,false);
});
test('raw identity contents and signed URLs cannot enter the evidence model',()=>{
 assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,passport_number:'private'}).success,false);
 assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,recording_reference:'https://provider/file?token=private'}).success,false);
 assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,signers:[{...evidence.signers[0],kba_answers:['private']}]}).success,false);
});
test('recording retention metadata cannot precede actual execution',()=>assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,recording_retained_until:evidence.executed_at}).success,false));
test('provider completion is processing, never statutory completion',()=>assert.equal(mapBNEventToMilanoStatus('session_completed'),'SESSION_PROCESSING'));
test('provider replay is idempotent while separate signer evidence is distinct',()=>{
 const a={event_type:'photo_id_passed',notarization_id:'session',signer_email:'one@example.invalid',timestamp:'2026-01-01T00:00:00Z'};
 assert.equal(computeEventHash(a),computeEventHash({...a}));assert.notEqual(computeEventHash(a),computeEventHash({...a,signer_email:'two@example.invalid'}));
 assert.equal(computeEventHash({...a,event_id:'event1'}),computeEventHash({...a,event_id:'event1',message:'delivery metadata changed'}));
});
test('legacy provider-complete status without statutory proof is review-required client truth',()=>{
 const session={id,milano_ron_status:'RON_COMPLETED',payment_gate_status:'UNLOCKED',identity_status:'PASSED',kba_status:'PASSED'} as RONSession;
 const view=portalRONProjection(session,[],'client@example.invalid');assert.equal(view.milano_ron_status,'RON_REVIEW_REQUIRED');assert.equal(view.signing_url,null);
 assert.equal(portalRONProjection({...session,statutory_evidence_id:id,statutory_evidence_verified:true},[],'client@example.invalid').milano_ron_status,'RON_COMPLETED');
});

test('external provider fee evidence is optional, fixed-classified and excludes amounts',()=>{
 assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,external_provider_fee:{classification:'EXTERNAL_PROVIDER_NOTARIAL_FEE',reference:'provider:fee'}}).success,true);
 for(const fee of [{classification:'MILANO_REVENUE',reference:'provider:fee'},{classification:'EXTERNAL_PROVIDER_NOTARIAL_FEE',reference:'provider:fee',amount:25}]) assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,external_provider_fee:fee}).success,false);
});
test('expired commission, unknown QC and absent act count cannot verify',()=>{
 for(const change of [{commission_expires_at:'2025-01-01T00:00:00Z'},{qc_status:'PENDING'},{act_count:0}]) assert.equal(ronStatutoryEvidenceSchema.safeParse({...evidence,...change}).success,false);
});

test('a stored pointer without current server verification cannot project completion',()=>{
 const session={id,milano_ron_status:'RON_COMPLETED',statutory_evidence_id:id} as RONSession;
 assert.equal(portalRONProjection(session,[],'fixture@example.invalid').milano_ron_status,'RON_REVIEW_REQUIRED');
});
