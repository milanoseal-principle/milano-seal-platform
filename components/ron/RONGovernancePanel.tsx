"use client";

import { useCallback, useEffect, useState } from 'react';

type Row = Record<string, unknown> & { id: string };
const input = 'mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus-visible:outline-2 focus-visible:outline-[#E8CF8B]';
const button = 'min-h-11 rounded-lg border border-white/15 px-4 text-sm text-white/75 disabled:opacity-40';

// Operator governance for one RON session: retention evidence, holds and records requests (P5).
export function RONGovernancePanel({ matterId, sessionId }: { matterId: string; sessionId: string }) {
  const [records, setRecords] = useState<Row[]>([]);
  const [holds, setHolds] = useState<Row[]>([]);
  const [requests, setRequests] = useState<Row[]>([]);
  const [form, setForm] = useState({ requester_name: '', requester_email: '', record_category: 'JOURNAL_ENTRY', request_basis: '', reason: '' });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [retention, rr] = await Promise.all([
      fetch(`/api/dashboard/retention?matter_id=${matterId}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
      fetch(`/api/dashboard/ron/records-requests?matter_id=${matterId}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    ]);
    if (!retention?.ok || !rr?.ok) setMessage('Governance records could not be loaded. Nothing was changed; reload to retry.');
    setRecords((retention?.records ?? []).filter((r: Row) => r.ron_session_id === sessionId));
    setHolds(retention?.holds ?? []);
    setRequests((rr?.requests ?? []).filter((r: Row) => r.ron_session_id === sessionId));
  }, [matterId, sessionId]);
  useEffect(() => { void load(); }, [load]);

  async function post(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok && data.ok !== false ? 'Recorded.' : `${data.code ?? 'Rejected'}${Array.isArray(data.blockers) ? `: ${data.blockers.join(', ')}` : ''}. Nothing else changed.`);
      await load();
    } catch {
      setMessage('Network failure; server state unknown. Reload before retrying.');
    } finally {
      setBusy(false);
    }
  }

  const activeHolds = holds.filter((h) => !h.released_at);
  return (
    <section aria-labelledby="ron-governance-heading" className="rounded-2xl border border-white/[0.07] bg-[#090909] p-5">
      <h2 id="ron-governance-heading" className="font-serif text-lg text-white/85">Retention, Holds &amp; Records Requests</h2>
      {message && <p role="status" className="mt-3 rounded-lg border border-white/10 p-2 text-xs text-white/70">{message}</p>}

      <h3 className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">Retention evidence</h3>
      {records.length === 0 ? <p className="mt-1 text-xs text-white/35">Retention records are created when Milano verifies RON evidence.</p> : (
        <ul className="mt-2 space-y-1 text-xs text-white/55">{records.map((r) => (
          <li key={r.id} className="break-all">{String(r.record_type)} · {String(r.retention_rule)} · until {r.retention_until ? new Date(String(r.retention_until)).toLocaleDateString() : 'review required'} · {String(r.deletion_status)}</li>
        ))}</ul>
      )}
      <p className="mt-2 text-xs text-white/45">Active holds: {activeHolds.length}</p>
      <label className="mt-2 block text-xs text-white/45">Reason (holds, decisions)
        <input className={input} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      </label>
      <button type="button" disabled={busy || !form.reason.trim()} className={`${button} mt-2`} onClick={() => post('/api/dashboard/retention', { action: 'place_hold', matter_id: matterId, ron_session_id: sessionId, hold_type: 'legal', reason: form.reason })}>Place legal hold</button>

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
    </section>
  );
}
