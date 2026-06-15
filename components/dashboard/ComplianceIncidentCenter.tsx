"use client";

import { useState, useEffect, useCallback } from "react";

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  matter_id: string | null;
  release_frozen: boolean;
  client_safe_message: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string | null;
  resolved_at: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "border-red-500/50 text-red-400",
  high: "border-orange-500/40 text-orange-400/80",
  medium: "border-yellow-500/30 text-yellow-400/70",
  low: "border-[#C6A55A]/30 text-[#C6A55A]/60",
};

export function ComplianceIncidentCenter() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [form, setForm] = useState({
    incident_type: "", severity: "medium", matter_id: "",
    release_frozen: false, client_safe_message: "", internal_notes: "",
  });
  const [patchData, setPatchData] = useState({ status: "", client_safe_message: "", internal_notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/incidents");
      const json = await res.json() as { data?: Incident[]; error?: string };
      if (!res.ok) setError(json.error ?? "Failed to load");
      else setIncidents(json.data ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_type: form.incident_type,
          severity: form.severity,
          matter_id: form.matter_id || null,
          release_frozen: form.release_frozen,
          client_safe_message: form.client_safe_message || null,
          internal_notes: form.internal_notes || null,
        }),
      });
      if (res.ok) {
        setCreating(false);
        setForm({ incident_type: "", severity: "medium", matter_id: "", release_frozen: false, client_safe_message: "", internal_notes: "" });
        await load();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePatch(id: string) {
    setSubmitting(true);
    try {
      await fetch("/api/dashboard/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patchData }),
      });
      setSelected(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  const lbl = "block font-mono text-[9px] tracking-[0.18em] uppercase text-[#C6A55A]/60 mb-1";
  const inp = "w-full bg-[#0D0B08] border border-[#C6A55A]/15 px-3 py-2 text-white text-xs font-mono outline-none focus:border-[#C6A55A]/40 rounded-sm";

  return (
    <div className="relative z-10 mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.32em] text-[#C6A55A]/60">
            Compliance / Audit Control
          </p>
          <h1 className="font-serif text-3xl text-[#E4D2A4]">Compliance Incidents</h1>
          <p className="mt-2 text-sm text-white/40">Track and resolve compliance events. Release freeze controlled here.</p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="min-h-11 rounded border border-red-500/30 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-red-400/80 hover:border-red-500/60 transition-colors"
        >
          {creating ? "Cancel" : "Open Incident"}
        </button>
      </div>

      {creating && (
        <form onSubmit={(e) => { void handleCreate(e); }} className="mb-8 rounded border border-red-500/15 bg-[#0D0B08] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-red-400/60 mb-5">New Compliance Incident</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label className={lbl}>Incident Type</label><input className={inp} value={form.incident_type} onChange={e => setForm(f => ({ ...f, incident_type: e.target.value }))} placeholder="Document error, Delivery failure, Auth issue…" required /></div>
            <div>
              <label className={lbl}>Severity</label>
              <select className={inp} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div><label className={lbl}>Matter ID (optional)</label><input className={inp} value={form.matter_id} onChange={e => setForm(f => ({ ...f, matter_id: e.target.value }))} placeholder="MSL-XXXX" /></div>
            <div className="flex items-center gap-3 pt-5">
              <input type="checkbox" id="freeze" checked={form.release_frozen} onChange={e => setForm(f => ({ ...f, release_frozen: e.target.checked }))} className="accent-red-500" />
              <label htmlFor="freeze" className="font-mono text-[10px] text-red-400/80 uppercase tracking-[0.1em]">Freeze document release</label>
            </div>
            <div className="sm:col-span-2"><label className={lbl}>Client-Safe Message</label><textarea className={`${inp} min-h-[60px]`} value={form.client_safe_message} onChange={e => setForm(f => ({ ...f, client_safe_message: e.target.value }))} placeholder="We are reviewing your matter and will update you shortly." /></div>
            <div className="sm:col-span-2"><label className={lbl}>Internal Notes (not shown to client)</label><textarea className={`${inp} min-h-[60px]`} value={form.internal_notes} onChange={e => setForm(f => ({ ...f, internal_notes: e.target.value }))} /></div>
          </div>
          <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-red-600 text-white font-mono text-[10px] uppercase tracking-[0.18em] rounded disabled:opacity-50">
            {submitting ? "Opening…" : "Open Incident"}
          </button>
        </form>
      )}

      {selected && (
        <div className="mb-8 rounded border border-[#C6A55A]/20 bg-[#0D0B08] p-6">
          <div className="flex justify-between items-start mb-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">Update Incident — {selected.incident_type}</p>
            <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={patchData.status} onChange={e => setPatchData(p => ({ ...p, status: e.target.value }))}>
                <option value="">— no change —</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="remediation">Remediation</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div><label className={lbl}>Client-Safe Message</label><textarea className={`${inp} min-h-[60px]`} value={patchData.client_safe_message} onChange={e => setPatchData(p => ({ ...p, client_safe_message: e.target.value }))} /></div>
            <div className="sm:col-span-2"><label className={lbl}>Internal Notes</label><textarea className={`${inp} min-h-[60px]`} value={patchData.internal_notes} onChange={e => setPatchData(p => ({ ...p, internal_notes: e.target.value }))} /></div>
          </div>
          <button onClick={() => { void handlePatch(selected.id); }} disabled={submitting} className="px-5 py-2.5 bg-[#C6A55A] text-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.18em] rounded disabled:opacity-50">
            {submitting ? "Saving…" : "Save Update"}
          </button>
        </div>
      )}

      {loading ? (
        <p className="font-mono text-[10px] text-[#C6A55A]/40 uppercase tracking-widest">Loading…</p>
      ) : error ? (
        <div className="rounded border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-200/70">{error}</div>
      ) : incidents.length === 0 ? (
        <div className="rounded border border-[#C6A55A]/10 bg-[#0D0B08] p-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6A55A]/40">No active incidents</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {incidents.map(inc => (
            <div key={inc.id} className={`rounded border bg-[#0D0B08] p-5 ${inc.release_frozen ? "border-red-500/30" : "border-[#C6A55A]/10"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-serif text-sm text-white/80">{inc.incident_type}</span>
                  <span className={`font-mono text-[8px] px-2 py-0.5 rounded border uppercase ${SEVERITY_COLORS[inc.severity] ?? "border-white/10 text-white/30"}`}>{inc.severity}</span>
                  <span className="font-mono text-[8px] px-2 py-0.5 rounded border border-white/10 text-white/40 uppercase">{inc.status}</span>
                  {inc.release_frozen && <span className="font-mono text-[8px] px-2 py-0.5 rounded border border-red-500/40 text-red-400/80 uppercase">Release Frozen</span>}
                  {inc.matter_id && <span className="font-mono text-[9px] text-[#C6A55A]/50">{inc.matter_id}</span>}
                </div>
                <button
                  onClick={() => { setSelected(inc); setPatchData({ status: inc.status, client_safe_message: inc.client_safe_message ?? "", internal_notes: inc.internal_notes ?? "" }); }}
                  className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#C6A55A]/60 hover:text-[#C6A55A] transition-colors"
                >
                  Update
                </button>
              </div>
              <p className="font-mono text-[9px] text-white/25">{new Date(inc.created_at).toLocaleString()}</p>
              {inc.internal_notes && (
                <p className="mt-2 text-xs text-white/40 font-mono leading-relaxed border-l border-[#C6A55A]/15 pl-3">{inc.internal_notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
