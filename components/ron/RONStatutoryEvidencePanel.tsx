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
        <p className="mt-2 text-white/35">Retention: {text(s.retention_rule) || 'set at verification'} {s.retention_until ? `until ${new Date(String(s.retention_until)).toLocaleDateString()}` : ''} · Fee class: {text(s.notarial_fee_classification) || 'unclassified'} · QC: {text(s.qc_status)} · Exception: {text(s.exception_status)}</p>
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
}
