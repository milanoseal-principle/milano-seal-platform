'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ronStatutoryEvidenceSchema } from '@/lib/bluenotary/statutoryEvidence';
const fields = {
 provider_evidence_reference:'Provider evidence reference',notary_identity_reference:'Notary identity reference',commission_reference:'Commission record reference',commission_jurisdiction:'Commission jurisdiction',
 certificate_reference:'Completed certificate reference',seal_signature_reference:'Validated electronic seal/signature reference',
 journal_reference:'Journal entry reference',recording_reference:'Recording reference',recording_retention_reference:'Recording retention policy/custodian reference',
 custody_reference:'Custody event reference',qc_reference:'Passed RON QA review ID',
};
const proofNames = ['location_reference','identity_proofing','credential_analysis','kba','awareness','willingness','oath'] as const;
const input = 'mt-1 min-h-11 w-full min-w-0 rounded border border-white/20 bg-black p-2 text-base text-white';
export function RONStatutoryEvidencePanel({ sessionId, providerReference, evidenceId, signerIds, documents, notarialAct, witnessCount, reopened = false }: {
 sessionId:string;providerReference:string;evidenceId:string|null;signerIds:string[];documents:{id:string;document_name:string;signed_sha256:string|null}[];notarialAct:string;witnessCount:number|null;reopened?:boolean;
}) {
 const router=useRouter();const key=useRef<string|null>(null);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function reopen(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();setBusy(true);
  try { const data=new FormData(event.currentTarget);const response=await fetch(`/api/dashboard/ron/sessions/${sessionId}/statutory-evidence/reopen`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expected_evidence_id:evidenceId,reason:String(data.get('reason')||'')})});
   setMessage(response.ok?'Evidence reopened for review. Refresh to enter corrected evidence.':'Reopen was not confirmed. Refresh the current session before retrying.');if(response.ok)router.refresh();
  } catch {setMessage('Reopen outcome unknown. Refresh before retrying.');}finally{setBusy(false);}
 }
 async function submit(event:React.FormEvent<HTMLFormElement>) {
  event.preventDefault();const data=new FormData(event.currentTarget);setMessage('');
  const proof=(name:string)=>({status:'VERIFIED' as const,reference:String(data.get(name)||'')});
  const evidence={commission_expires_at:new Date(String(data.get('commission_expires_at'))).toISOString(),act_count:Number(data.get('act_count')),qc_status:'PASSED',provider_reference:providerReference,notarial_act:notarialAct,
   ...Object.fromEntries(Object.keys(fields).map(k=>[k,String(data.get(k)||'')])),
   executed_at:new Date(String(data.get('executed_at'))).toISOString(),recording_retained_until:new Date(String(data.get('recording_retained_until'))).toISOString(),
   ...(data.get('external_provider_fee_reference')?{external_provider_fee:{classification:'EXTERNAL_PROVIDER_NOTARIAL_FEE',reference:String(data.get('external_provider_fee_reference'))}}:{}),
   signed_document_ids:data.getAll('signed_document_id').map(String),
   signers:signerIds.map(id=>({signer_id:id,location_reference:String(data.get(`${id}:location_reference`)||''),identity_proofing:proof(`${id}:identity_proofing`),credential_analysis:proof(`${id}:credential_analysis`),kba:proof(`${id}:kba`),awareness:proof(`${id}:awareness`),willingness:proof(`${id}:willingness`),oath:['jurat','oath_affirmation'].includes(notarialAct)?proof(`${id}:oath`):{status:'NOT_REQUIRED' as const,basis_reference:String(data.get(`${id}:oath`)||'')}})),
   witness_applicability:{status:String(data.get('witness_applicability')||''),basis_reference:String(data.get('witness_basis_reference')||'')},
   witnesses:Array.from({length:witnessCount??0},(_,i)=>({identity_reference:String(data.get(`witness:${i}:identity`)||''),evidence_reference:String(data.get(`witness:${i}:evidence`)||'')})),
  };
  const valid=ronStatutoryEvidenceSchema.safeParse(evidence);
  if(!valid.success){setMessage(`Evidence remains unverified. Review: ${valid.error.issues.map(i=>i.path.join('.')).join(', ')}`);return;}
  key.current ??= crypto.randomUUID();setBusy(true);
  try {
   const response=await fetch(`/api/dashboard/ron/sessions/${sessionId}/statutory-evidence`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({evidence:valid.data,expected_evidence_id:evidenceId,idempotency_key:key.current,reason:String(data.get('reason')||'')})});
   if(!response.ok){const failure=await response.json().catch(()=>null);setMessage(typeof failure?.next_action==='string'?failure.next_action:'Evidence was not verified. Refresh the session and review provider evidence before retrying.');return;}
   const receipt=await response.json();setMessage(receipt.duplicate?'Evidence request was already recorded. Refresh shows the current session evidence state.':'Statutory evidence verified and appended. Earlier evidence is preserved.');key.current=null;router.refresh();
  } catch {setMessage('Verification outcome is unknown. Retry the same evidence to reuse this request key.');}finally{setBusy(false);}
 }
 return <section className="rounded-2xl border border-white/15 bg-[#090909] p-5" aria-labelledby="statutory-evidence-title">
  <h2 id="statutory-evidence-title" className="font-serif text-lg text-white">RON statutory evidence</h2>
  <p className="my-3 text-sm text-white/60">{evidenceId?'Verified evidence is locked. An authorized reopen with a reason is required before a correction.':'Execution remains unverified until required evidence is reviewed and appended.'} Provider completion alone does not verify identity, recording, certificate, seal or execution evidence.</p>
  <p className="mb-4 text-sm text-white/60">Use opaque references to approved records. Never enter identity-document contents, KBA answers, credentials or signed URLs.</p>
  {evidenceId&&!reopened?<form onSubmit={reopen} className="grid gap-3"><label className="text-white">Reason to reopen verified evidence<input name="reason" required minLength={10} maxLength={500} className={input}/></label><button disabled={busy} className="min-h-12 text-amber-200">Reopen for governed correction</button><p role="status" className="text-white">{message}</p></form>:<>
  {witnessCount===null&&<p className="text-amber-200">Witness applicability is unresolved. Complete governed execution review before verification.</p>}
  <p className="mb-3 text-sm text-white/70"><a href="/dashboard/execution-qa" className="underline">Open Execution QA</a> to resolve checklist and witness requirements. <a href="/dashboard/incidents" className="underline">Open incidents</a> to resolve blocking exceptions.</p>
  <form onSubmit={submit} className="grid min-w-0 gap-4 sm:grid-cols-2">
   <p className="break-all text-sm text-white/60 sm:col-span-2">Provider session: {providerReference||'Unavailable'} · Approved act: {notarialAct}</p>
   {Object.entries(fields).map(([key,label])=><label key={key} className="min-w-0 text-sm text-white/75">{label}<input name={key} required maxLength={200} pattern="[A-Za-z0-9][A-Za-z0-9:_/.-]*" className={input}/></label>)}
   <label className="text-sm text-white/75">External provider notarial fee reference (optional; excluded from Milano charges)<input name="external_provider_fee_reference" maxLength={200} className={input}/></label>
   <label className="text-sm text-white/75">Commission expires (local time)<input type="datetime-local" name="commission_expires_at" required className={input}/></label>
   <label className="text-sm text-white/75">Number of notarial acts<input type="number" name="act_count" min={1} max={1000} required className={input}/></label>
   <label className="text-sm text-white/75">Actual execution time (local time, from evidence)<input type="datetime-local" name="executed_at" required className={input}/></label>
   <label className="text-sm text-white/75">Recording retained through (local time)<input type="datetime-local" name="recording_retained_until" required className={input}/></label>
   <div className="min-w-0 sm:col-span-2"><h3 className="text-white">Immutable executed versions</h3>{documents.filter(d=>d.signed_sha256).map(d=><label key={d.id} className="mt-2 flex min-h-11 gap-2 break-all text-xs text-white/60"><input type="checkbox" name="signed_document_id" value={d.id} defaultChecked={documents.filter(v=>v.signed_sha256).length===1}/><span>{d.document_name} · SHA-256 {d.signed_sha256}</span></label>)}{!documents.some(d=>d.signed_sha256)&&<p className="text-sm text-amber-200">Retrieve executed documents first. Legacy un-hashed artifacts do not establish historical proof.</p>}</div>
   {signerIds.map((id,index)=><fieldset key={id} className="grid min-w-0 gap-3 rounded border border-white/15 p-3 sm:col-span-2 sm:grid-cols-2"><legend className="text-white">Signer {index+1} evidence</legend>{proofNames.map(name=><label key={name} className="min-w-0 text-sm text-white/75">{name==='oath'&&!['jurat','oath_affirmation'].includes(notarialAct)?'Oath not-required basis reference':name.replaceAll('_',' ')+' verified reference'}<input name={`${id}:${name}`} required maxLength={200} className={input}/></label>)}</fieldset>)}
   <label className="text-sm text-white/75">Governed witness applicability<select name="witness_applicability" required defaultValue="" className={input}><option value="" disabled>Select reviewed requirement</option><option value="NOT_REQUIRED">Not required by governed review</option><option value="REQUIRED">Witnesses required by governed review</option></select></label>
   <label className="text-sm text-white/75">Governed witness review reference<input name="witness_basis_reference" required maxLength={200} className={input}/></label>
   {Array.from({length:witnessCount??0},(_,i)=><fieldset key={i} className="grid gap-3 sm:col-span-2 sm:grid-cols-2"><legend className="text-white">Required witness {i+1}</legend><label className="text-white/75">Identity reference<input name={`witness:${i}:identity`} required className={input}/></label><label className="text-white/75">Evidence reference<input name={`witness:${i}:evidence`} required className={input}/></label></fieldset>)}
   <label className="text-sm text-white/75 sm:col-span-2">Verification / correction reason<input name="reason" required minLength={10} maxLength={500} className={input}/></label>
   <label className="flex min-h-11 gap-3 text-sm text-white/75 sm:col-span-2"><input type="checkbox" required/>I reviewed actual evidence for this session and exact document versions; these are not inferred success states.</label>
   <button disabled={busy||witnessCount===null||!providerReference||!signerIds.length||!documents.some(d=>d.signed_sha256)} className="min-h-12 rounded border border-[#C6A55A] p-3 text-[#E8CF8B] disabled:opacity-50 sm:col-span-2">{busy?'Verifying evidence…':'Verify and append evidence'}</button>
   <p role="status" className="break-words text-sm text-white/70 sm:col-span-2">{message}</p>
  </form></>}
 </section>;
}
