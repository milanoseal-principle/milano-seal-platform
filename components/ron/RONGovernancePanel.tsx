"use client";

import { useCallback, useEffect, useId, useState } from 'react';

type Row = Record<string, unknown> & { id: string };
const input = 'mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus-visible:outline-2 focus-visible:outline-[#E8CF8B]';
const button = 'min-h-11 rounded-lg border border-white/15 px-4 text-sm text-white/75 disabled:opacity-40';

// Operator governance for one RON session: retention evidence, holds and records requests (P5).
export function RONGovernancePanel({ matterId, sessionId, canAuthorizeRetention = false }: { matterId: string; sessionId?: string; canAuthorizeRetention?: boolean }) {
  const headingId = useId();
  const [history, setHistory] = useState<Row[]>([]);
  const [deletionEvidence, setDeletionEvidence] = useState('');
  const [policy, setPolicy] = useState({ years: '', basis: '', start: '' });
  const [records, setRecords] = useState<Row[]>([]);
  const [holds, setHolds] = useState<Row[]>([]);
  const [requests, setRequests] = useState<Row[]>([]);
  const [form, setForm] = useState({ requester_name: '', requester_email: '', record_category: 'JOURNAL_ENTRY', request_basis: '', reason: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [retention, rr] = await Promise.all([
      fetch(`/api/dashboard/retention?matter_id=${matterId}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      sessionId ? fetch(`/api/dashboard/ron/records-requests?matter_id=${matterId}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null) : Promise.resolve({ ok: true, requests: [] }),
    ]);
    if (!retention?.ok || !rr?.ok) setMessage('Governance records could not be loaded. Current server state is unverified; reload before retrying.');
    setRecords((retention?.records ?? []).filter((r: Row) => !sessionId || r.ron_session_id === sessionId));
    setHolds(retention?.holds ?? []);
    setHistory(retention?.hold_history ?? []);
    setRequests((rr?.requests ?? []).filter((r: Row) => !sessionId || r.ron_session_id === sessionId));
  }, [matterId, sessionId]);
  useEffect(() => { void load(); }, [load]);

  async function post(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok && data.ok === true ? 'Recorded.' : `${data.code ?? 'Rejected'}${Array.isArray(data.blockers) ? `: ${data.blockers.join(', ')}` : ''}. Refresh the recorded state before retrying.`);
      await load();
    } catch {
      setMessage('Network failure; server state unknown. Reload before retrying.');
    } finally {
      setBusy(false);
    }
  }

  const activeHolds = holds.filter((h) => !h.released_at);
  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-white/[0.07] bg-[#090909] p-5">
      <h2 id={headingId} className="font-serif text-lg text-white/85">Retention, Holds &amp; Records Requests</h2>
      {message && <p role="status" className="mt-3 rounded-lg border border-white/10 p-2 text-xs text-white/70">{message}</p>}

      <h3 className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">Retention evidence</h3>
      {records.length === 0 ? <p className="mt-1 text-xs text-white/35">No retention evidence is available for this scope. Retention decisions require an approved policy.</p> : (
        <ul className="mt-2 space-y-1 text-xs text-white/55">{records.map((r) => (
          <li key={r.id} className="break-all">{String(r.record_type)} · {String(r.retention_rule)} · until {r.retention_until ? new Date(String(r.retention_until)).toLocaleDateString() : 'review required'} · {String(r.deletion_status)}{r.deletion_claim_outcome ? ` · destruction outcome: ${String(r.deletion_claim_outcome)}` : ''}
            {canAuthorizeRetention && r.policy_status === 'review_required' && <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={button} disabled={busy || !form.reason.trim() || !policy.years || !policy.basis.trim() || !deletionEvidence.trim()} onClick={() => post('/api/dashboard/retention', { action: 'approve_class', matter_id: matterId, class_id: r.retention_class, duration_years: Number(policy.years), basis: policy.basis, evidence_reference: deletionEvidence, reason: form.reason })}>Approve class policy globally</button>
              <button type="button" className={button} disabled={busy || !form.reason.trim() || !policy.start || !deletionEvidence.trim()} onClick={() => post('/api/dashboard/retention', { action: 'resolve_record', retention_record_id: r.id, start_at: new Date(policy.start).toISOString(), evidence_reference: deletionEvidence, reason: form.reason })}>Apply approved policy to record</button>
            </div>}
            {canAuthorizeRetention && r.deletion_status !== 'deleted' && <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className={button} disabled={busy || !form.reason.trim() || ['pending','unknown'].includes(String(r.deletion_claim_outcome))} onClick={() => post('/api/dashboard/retention', { action: 'authorize', retention_record_id: r.id, reason: form.reason })}>Authorize expired retention deletion</button>
              <button type="button" className={button} disabled={busy || !form.reason.trim() || r.deletion_status !== 'authorized' || ['pending','unknown'].includes(String(r.deletion_claim_outcome))} onClick={() => post('/api/dashboard/retention', { action: 'execute', retention_record_id: r.id, reason: form.reason, provider_deletion_evidence_ref: deletionEvidence })}>Delete authorized record</button>
              {['pending','unknown'].includes(String(r.deletion_claim_outcome)) && <>
                <button type="button" className={button} disabled={busy || !form.reason.trim() || !deletionEvidence.trim()} onClick={() => post('/api/dashboard/retention', { action: 'reconcile', retention_record_id: r.id, reason: form.reason, claim_id: r.deletion_claim, outcome: 'not_deleted', result: { evidence_reference: deletionEvidence } })}>Record verified preservation</button>
                <button type="button" className={button} disabled={busy || !form.reason.trim() || !deletionEvidence.trim()} onClick={() => post('/api/dashboard/retention', { action: 'reconcile', retention_record_id: r.id, reason: form.reason, claim_id: r.deletion_claim, outcome: 'deleted', result: { evidence_reference: deletionEvidence } })}>Record verified deletion</button>
              </>}
            </div>}
          </li>
        ))}</ul>
      )}
      <p className="mt-2 text-xs text-white/45">Active holds: {activeHolds.length}</p>
      <label className="mt-2 block text-xs text-white/45">Reason (holds, decisions)
        <input className={input} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      </label>
      <button type="button" disabled={busy || !form.reason.trim()} className={`${button} mt-2`} onClick={() => post('/api/dashboard/retention', { action: 'place_hold', matter_id: matterId, ron_session_id: sessionId ?? null, hold_type: 'legal', reason: form.reason, idempotency_key: crypto.randomUUID() })}>Place legal hold</button>

      <ul className="mt-2 space-y-2 text-xs text-white/55">{activeHolds.map(h => <li key={h.id} className="break-all">{String(h.hold_type)} · {String(h.reason)}
        {canAuthorizeRetention && <button type="button" className={`${button} ml-2`} disabled={busy || !form.reason.trim()} onClick={() => post('/api/dashboard/retention', { action: 'release_hold', hold_id: h.id, reason: form.reason })}>Release hold with reason</button>}
      </li>)}</ul>
      {canAuthorizeRetention && <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-white/45">Owner-approved retention years (global class policy)<input type="number" min="1" max="100" className={input} value={policy.years} onChange={e => setPolicy({ ...policy, years: e.target.value })} /></label>
        <label className="text-xs text-white/45">Approved policy basis<input className={input} value={policy.basis} onChange={e => setPolicy({ ...policy, basis: e.target.value })} /></label>
        <label className="text-xs text-white/45">Verified record retention start<input type="datetime-local" className={input} value={policy.start} onChange={e => setPolicy({ ...policy, start: e.target.value })} /></label>
      </div>}
      {canAuthorizeRetention && <label className="mt-3 block text-xs text-white/45">Provider deletion or reconciliation evidence reference
        <input className={input} value={deletionEvidence} onChange={e => setDeletionEvidence(e.target.value)} />
      </label>}
      <p className="mt-2 text-xs text-white/45">Deletion requires expired approved retention, no active holds and human authorization. Unknown outcomes require evidence review before another attempt.</p>
      <details className="mt-3 text-xs text-white/45"><summary>Preservation history ({history.length})</summary><ul>{history.map(event => <li key={event.id}>{String(event.event_type)} · {String(event.created_at)}</li>)}</ul></details>
      {sessionId && <>
      <h3 className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">Records requests</h3>
      <ul className="mt-2 space-y-1 text-xs text-white/55">{requests.map((r) => (
        <li key={r.id} className="rounded-lg border border-white/[0.06] p-2">{String(r.record_category)} · {String(r.requester_name)} · {String(r.requester_verification_state)} · {String(r.decision)} · redaction {String(r.redaction_status)} · {String(r.review_status)}
          {!r.released_at && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" disabled={busy || !form.reason.trim()} className={button} onClick={() => post(`/api/dashboard/ron/records-requests/${r.id}`, { action: 'verify_requester', state: 'verified', evidence_ref: form.reason })}>Verify requester (reason = evidence)</button>
              <button type="button" disabled={busy || !form.reason.trim()} className={button} onClick={() => post(`/api/dashboard/ron/records-requests/${r.id}`, { action: 'decide', decision: 'approved', reason: form.reason })}>Approve</button>
              <button type="button" disabled={busy || !form.reason.trim()} className={button} onClick={() => post(`/api/dashboard/ron/records-requests/${r.id}`, { action: 'decide', decision: 'denied', reason: form.reason })}>Deny</button>
              <button type="button" disabled={busy || !form.reason.trim()} className={button} onClick={() => post(`/api/dashboard/ron/records-requests/${r.id}`, { action: 'set_redaction', redaction_status: 'not_required', reason: form.reason })}>No redaction needed</button>
              <button type="button" disabled={busy || !form.reason.trim()} className={button} onClick={() => post(`/api/dashboard/ron/records-requests/${r.id}`, { action: 'set_redaction', redaction_status: 'completed', reason: form.reason })}>Redaction completed</button>
              <button type="button" disabled={busy} className={button} onClick={() => { const versionId = prompt('Exact document version ID to release'); if (versionId) void post(`/api/dashboard/ron/records-requests/${r.id}`, { action: 'release', release_document_version_id: versionId.trim() }); }}>Release exact version</button>
            </div>
          )}
        </li>
      ))}</ul>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-white/45">Requester name<input className={input} value={form.requester_name} onChange={(e) => setForm({ ...form, requester_name: e.target.value })} /></label>
        <label className="text-xs text-white/45">Requester email<input type="email" className={input} value={form.requester_email} onChange={(e) => setForm({ ...form, requester_email: e.target.value })} /></label>
        <label className="text-xs text-white/45">Record category
          <select className={input} value={form.record_category} onChange={(e) => setForm({ ...form, record_category: e.target.value })}>
            {['JOURNAL_ENTRY', 'AV_RECORDING', 'EXECUTED_DOCUMENT', 'SESSION_EVIDENCE'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-xs text-white/45">Request basis / authority<input className={input} value={form.request_basis} onChange={(e) => setForm({ ...form, request_basis: e.target.value })} /></label>
      </div>
      <button type="button" disabled={busy || !form.requester_name.trim() || !form.request_basis.trim()} className={`${button} mt-2`} onClick={() => post('/api/dashboard/ron/records-requests', { matter_id: matterId, ron_session_id: sessionId, requester_name: form.requester_name, requester_email: form.requester_email, record_category: form.record_category, request_basis: form.request_basis })}>Record request</button>
      </>}
    </section>
  );
}
