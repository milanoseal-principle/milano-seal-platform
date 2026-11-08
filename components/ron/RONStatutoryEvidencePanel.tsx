"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type Row = Record<string, unknown> & { id: string };
interface EvidenceState {
  lifecycle: string;
  session: Record<string, unknown>;
  signers: Row[];
  documents: Row[];
  missing_for_verification: string[];
  missing_for_completion: string[];
  database_missing: string[] | null;
}

const SESSION_FIELDS: Array<[string, string, string?]> = [
  ['notary_name', 'Notary name'],
  ['notary_provider_reference', 'Notary provider reference'],
  ['notary_commission_number', 'Commission number'],
  ['notary_commission_jurisdiction', 'Commission jurisdiction (e.g. FL)'],
  ['notary_commission_expires_on', 'Commission expires (YYYY-MM-DD)'],
  ['notary_ron_registration_reference', 'RON registration reference'],
  ['notarial_act_type', 'Notarial act (acknowledgment, jurat, oath_affirmation, signature_witnessing, other)'],
  ['notarial_act_count', 'Number of notarial acts', 'number'],
  ['certificate_completion_reference', 'Certificate completion reference'],
  ['electronic_signature_reference', 'Electronic signature reference'],
  ['electronic_seal_reference', 'Electronic seal reference'],
  ['witness_requirement', 'Witness requirement (required, not_required, review_required)'],
  ['execution_completed_at', 'Execution timestamp (ISO 8601)'],
  ['journal_reference', 'Journal reference'],
  ['av_recording_reference', 'A/V recording reference'],
  ['provider_fee_evidence_reference', 'Provider fee evidence reference (optional; external provider charge, not Milano)'],
];
const SIGNER_FIELDS: Array<[string, string]> = [
  ['signer_reference', 'Signer reference'],
  ['signer_location_jurisdiction', 'Signer location jurisdiction'],
  ['signer_location_evidence_reference', 'Location evidence reference'],
  ['identity_proofing_result', 'Identity proofing result (passed/failed)'],
  ['identity_proofing_reference', 'Identity proofing reference'],
  ['credential_analysis_result', 'Credential analysis result'],
  ['credential_analysis_reference', 'Credential analysis reference'],
  ['kba_result', 'KBA result'],
  ['kba_reference', 'KBA reference'],
  ['awareness_willingness_confirmed_at', 'Awareness/willingness confirmed at (ISO)'],
  ['awareness_willingness_reference', 'Awareness/willingness reference'],
  ['oath_administered_at', 'Oath/affirmation administered at (ISO)'],
  ['oath_reference', 'Oath/affirmation reference'],
  ['witness_appearance', 'Witness appearance (remote/physical)'],
  ['witness_evidence_reference', 'Witness evidence reference'],
];

const text = (value: unknown) => (value == null ? '' : Array.isArray(value) ? value.join('\n') : String(value));
const inputClass = 'mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8CF8B]';

export function RONStatutoryEvidencePanel({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<EvidenceState | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [signerDraft, setSignerDraft] = useState<Record<string, Record<string, string>>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string } | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const base = `/api/dashboard/ron/sessions/${sessionId}/evidence`;

  const load = useCallback(async () => {
    const res = await fetch(base, { cache: 'no-store' });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.ok) {
      setMessage({ tone: 'error', text: `Evidence could not be loaded (${body?.code ?? res.status}). Nothing was changed; reload to retry.` });
      return;
    }
    setData(body);
    setDraft({});
    setSignerDraft({});
  }, [base]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (message) messageRef.current?.focus(); }, [message]);

  async function send(action: string, url: string, payload: Record<string, unknown>) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) {
        const missing = Array.isArray(body.missing) && body.missing.length ? ` Missing: ${body.missing.join(', ')}.` : '';
        setMessage({ tone: 'error', text: `${body.message ?? body.code ?? 'Request rejected'}.${missing} Saved evidence is unchanged; correct and retry.` });
        return;
      }
      setMessage({ tone: 'ok', text: body.duplicate ? 'No change — already recorded.' : `Recorded (${body.event_type ?? body.lifecycle ?? 'ok'}).` });
      setReason('');
      await load();
    } catch {
      setMessage({ tone: 'error', text: 'Network failure. The server state is unknown; reload before retrying — retries are idempotent.' });
    } finally {
      setBusy(null);
    }
  }

  function saveEvidence() {
    const session: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(draft)) {
      if (field === 'notarial_act_count') session[field] = value.trim() ? Number(value) : null;
      else if (field === 'provider_evidence_references') session[field] = value.split('\n').map((v) => v.trim()).filter(Boolean);
      else session[field] = value;
    }
    const signers = Object.entries(signerDraft).map(([id, values]) => ({ id, ...values }));
    void send('save', base, { session, signers, reason });
  }

  if (!data) {
    return <section aria-busy="true" className="rounded-2xl border border-white/[0.07] bg-[#090909] p-5 text-xs text-white/40">Loading statutory RON evidence…{message && <p role="alert" className="mt-2 text-[#E0876E]">{message.text}</p>}</section>;
  }

  const frozen = ['EVIDENCE_VERIFIED', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(data.lifecycle);
  const missing = data.lifecycle === 'EVIDENCE_VERIFIED' ? data.missing_for_completion : data.missing_for_verification;
  const s = data.session;

  return (
    <section aria-labelledby="ron-evidence-heading" className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#090909] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="ron-evidence-heading" className="font-serif text-lg text-white/85">Statutory RON Evidence</h2>
        <span data-testid="ron-lifecycle-state" className="w-fit rounded-full border border-[var(--ms-gold)]/30 px-3 py-1 font-mono text-[10px] text-[#E8CF8B]">{data.lifecycle}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-white/42">Provider completion is not Milano completion. Record governed references and results only — never raw identity documents or KBA answers.</p>

      {message && (
        <div ref={messageRef} tabIndex={-1} role={message.tone === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-xl border p-3 text-xs ${message.tone === 'error' ? 'border-[#E0876E]/30 text-[#E0876E]' : 'border-emerald-500/25 text-emerald-200'}`}>{message.text}</div>
      )}

      <div className="mt-4 rounded-xl border border-white/[0.06] p-3 text-xs" aria-live="polite">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">{missing.length ? `${missing.length} item(s) block the next step` : 'No evidence blockers for the next step'}</p>
        {missing.length > 0 && <ul className="mt-2 flex flex-wrap gap-1.5">{missing.map((code) => <li key={code} className="rounded-full border border-[#E0876E]/25 px-2 py-0.5 font-mono text-[10px] text-[#E0876E]">{code}</li>)}</ul>}
        <p className="mt-2 text-white/35">Retention: {text(s.retention_rule) || 'set at verification'} {s.retention_until ? `until ${new Date(String(s.retention_until)).toLocaleDateString()}` : ''} · Notarial fee: {s.provider_fee_evidence_classification === 'EXTERNAL_PROVIDER_NOTARIAL_FEE' ? 'external provider-controlled (not a Milano charge)' : 'not recorded'} · QC: {text(s.qc_status)} · Exception: {text(s.exception_status)}</p>
      </div>

      <fieldset disabled={frozen || busy !== null} className="mt-4 grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Session evidence</legend>
        {SESSION_FIELDS.map(([field, label, type]) => (
          <label key={field} className="text-xs text-white/45">{label}
            <input type={type ?? 'text'} className={inputClass} value={draft[field] ?? text(s[field])} onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))} />
          </label>
        ))}
        <label className="text-xs text-white/45 sm:col-span-2">Provider evidence references (one per line)
          <textarea rows={3} className={inputClass} value={draft.provider_evidence_references ?? text(s.provider_evidence_references)} onChange={(e) => setDraft((d) => ({ ...d, provider_evidence_references: e.target.value }))} />
        </label>
      </fieldset>

      {data.signers.map((signer) => (
        <fieldset key={signer.id} disabled={frozen || busy !== null} className="mt-4 rounded-xl border border-white/[0.06] p-3">
          <legend className="px-1 text-xs text-white/60">{text(signer.party_role) === 'witness' ? 'Witness' : 'Signer'} · {text(signer.first_name)} {text(signer.last_name)}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {SIGNER_FIELDS.map(([field, label]) => (
              <label key={field} className="text-xs text-white/45">{label}
                <input className={inputClass} value={signerDraft[signer.id]?.[field] ?? text(signer[field])} onChange={(e) => setSignerDraft((d) => ({ ...d, [signer.id]: { ...(d[signer.id] ?? {}), [field]: e.target.value } }))} />
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="mt-4 space-y-2 text-xs">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">Executed artifacts</h3>
        {data.documents.filter((d) => d.executed_sha256).length === 0 ? <p className="text-white/35">No executed artifact captured yet.</p> : data.documents.filter((d) => d.executed_sha256).map((doc) => (
          <div key={doc.id} className="rounded-lg border border-white/[0.06] p-2"><p className="text-white/65">{text(doc.document_name)}</p><p className="break-all font-mono text-[10px] text-white/35">sha256 {text(doc.executed_sha256)} · version {text(doc.executed_document_version_id)} · custody {text(doc.custody_ledger_hash) || 'pending'}</p></div>
        ))}
      </div>

      <label className="mt-4 block text-xs text-white/45">Reason (required for corrections, exceptions, reopen and fail)
        <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" disabled={frozen || busy !== null} onClick={saveEvidence} className="min-h-11 rounded-lg border border-[var(--ms-gold)]/40 px-4 text-sm text-[#E8CF8B] disabled:opacity-40">{busy === 'save' ? 'Saving…' : 'Save evidence'}</button>
        <button type="button" disabled={data.lifecycle !== 'EVIDENCE_PENDING' || busy !== null} onClick={() => send('verify', `${base}/verify`, { action: 'verify' })} className="min-h-11 rounded-lg border border-emerald-500/30 px-4 text-sm text-emerald-200 disabled:opacity-40">Verify statutory evidence</button>
        <button type="button" disabled={data.lifecycle !== 'EVIDENCE_VERIFIED' || !reason || busy !== null} title="Enter the QC review reference in the reason field" onClick={() => send('qc', base, { session: { qc_status: 'passed', qc_review_reference: reason } })} className="min-h-11 rounded-lg border border-white/15 px-4 text-sm text-white/75 disabled:opacity-40">Record QC passed (reason = QC reference)</button>
        <button type="button" disabled={frozen || busy !== null} onClick={() => { const first = prompt('Witness first name'); const last = prompt('Witness last name'); if (first && last) void send('witness', base, { signers: [{ party_role: 'witness', first_name: first, last_name: last }] }); }} className="min-h-11 rounded-lg border border-white/15 px-4 text-sm text-white/60 disabled:opacity-40">Add witness</button>
        <button type="button" disabled={data.lifecycle !== 'EVIDENCE_VERIFIED' || busy !== null} onClick={() => send('complete', `${base}/verify`, { action: 'complete' })} className="min-h-11 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] px-4 text-sm text-emerald-100 disabled:opacity-40">Complete RON (Milano)</button>
        <button type="button" disabled={data.lifecycle !== 'EVIDENCE_VERIFIED' || !reason || busy !== null} onClick={() => send('reopen', `${base}/verify`, { action: 'reopen', reason })} className="min-h-11 rounded-lg border border-white/15 px-4 text-sm text-white/60 disabled:opacity-40">Reopen for correction</button>
        <button type="button" disabled={['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.lifecycle) || !reason || busy !== null} onClick={() => send('exception', base, { session: { exception_status: s.exception_status === 'open' ? 'resolved' : 'open' }, reason })} className="min-h-11 rounded-lg border border-[#E0876E]/30 px-4 text-sm text-[#E0876E] disabled:opacity-40">{s.exception_status === 'open' ? 'Resolve exception' : 'Open exception'}</button>
        <button type="button" disabled={['COMPLETED', 'FAILED', 'CANCELLED'].includes(data.lifecycle) || !reason || busy !== null} onClick={() => send('fail', `${base}/verify`, { action: 'fail', reason })} className="min-h-11 rounded-lg border border-red-700/40 px-4 text-sm text-red-300 disabled:opacity-40">Mark session failed</button>
      </div>
    </section>
  );
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
