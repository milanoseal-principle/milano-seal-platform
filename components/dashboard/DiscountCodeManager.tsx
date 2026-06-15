"use client";

import { useState, useEffect, useCallback } from "react";

interface DiscountCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  client_label: string | null;
  internal_reason: string | null;
  active: boolean;
  created_at: string;
  expires_at: string | null;
  uses: number | null;
  max_uses: number | null;
}

export function DiscountCodeManager() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: "", discount_type: "percent", discount_value: "",
    client_label: "", internal_reason: "", max_uses: "", expires_at: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/discounts");
      const json = await res.json() as { data?: DiscountCode[]; error?: string };
      if (!res.ok) setError(json.error ?? "Failed to load");
      else setCodes(json.data ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.code || !form.discount_value) { setFormError("Code and value required."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          client_label: form.client_label || null,
          internal_reason: form.internal_reason || null,
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          expires_at: form.expires_at || null,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setFormError(json.error ?? "Failed to create"); return; }
      setForm({ code: "", discount_type: "percent", discount_value: "", client_label: "", internal_reason: "", max_uses: "", expires_at: "" });
      setCreating(false);
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch("/api/dashboard/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    await load();
  }

  const lbl = "block font-mono text-[9px] tracking-[0.18em] uppercase text-[#C6A55A]/60 mb-1";
  const inp = "w-full bg-[#0D0B08] border border-[#C6A55A]/15 px-3 py-2 text-white text-xs font-mono outline-none focus:border-[#C6A55A]/40 rounded-sm";

  return (
    <div className="relative z-10 mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.32em] text-[#C6A55A]/60">
            Founder / Admin Access Only
          </p>
          <h1 className="font-serif text-3xl text-[#E4D2A4]">Discount Codes</h1>
          <p className="mt-2 text-sm text-white/40">Create and manage promotional discount codes for matter intake.</p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="min-h-11 rounded border border-[#C6A55A]/30 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#C6A55A] hover:border-[#C6A55A]/60 transition-colors"
        >
          {creating ? "Cancel" : "+ New Code"}
        </button>
      </div>

      {creating && (
        <form onSubmit={(e) => { void handleCreate(e); }} className="mb-8 rounded border border-[#C6A55A]/15 bg-[#0D0B08] p-6">
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60 mb-5">Create Discount Code</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label className={lbl}>Code</label><input className={inp} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EXAMPLE50" /></div>
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat ($)</option>
              </select>
            </div>
            <div><label className={lbl}>Value</label><input className={inp} type="number" step="0.01" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder="10" /></div>
            <div><label className={lbl}>Client Label (public)</label><input className={inp} value={form.client_label} onChange={e => setForm(f => ({ ...f, client_label: e.target.value }))} placeholder="10% off apostille" /></div>
            <div><label className={lbl}>Internal Reason (private)</label><input className={inp} value={form.internal_reason} onChange={e => setForm(f => ({ ...f, internal_reason: e.target.value }))} placeholder="Partner referral Q2" /></div>
            <div><label className={lbl}>Max Uses</label><input className={inp} type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} placeholder="Unlimited" /></div>
            <div><label className={lbl}>Expires At</label><input className={inp} type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
          </div>
          {formError && <p className="text-red-400/80 text-xs font-mono mb-3">{formError}</p>}
          <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#C6A55A] text-[#0A0A0A] font-mono text-[10px] uppercase tracking-[0.18em] rounded disabled:opacity-50">
            {submitting ? "Creating…" : "Create Code"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="font-mono text-[10px] text-[#C6A55A]/40 uppercase tracking-widest">Loading…</p>
      ) : error ? (
        <div className="rounded border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-200/70">{error}</div>
      ) : codes.length === 0 ? (
        <div className="rounded border border-[#C6A55A]/10 bg-[#0D0B08] p-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6A55A]/40">No discount codes</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-[#C6A55A]/10 bg-[#0D0B08]">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead className="border-b border-[#C6A55A]/10 font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A55A]/55">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Client Label</th>
                <th className="px-4 py-3">Uses</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {codes.map(c => (
                <tr key={c.id} className="text-white/60">
                  <td className="px-4 py-4 font-mono font-bold text-[#C6A55A]">{c.code}</td>
                  <td className="px-4 py-4 font-mono text-[10px]">{c.discount_type}</td>
                  <td className="px-4 py-4">{c.discount_type === "percent" ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                  <td className="px-4 py-4 text-white/40">{c.client_label ?? "—"}</td>
                  <td className="px-4 py-4">{c.uses ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                  <td className="px-4 py-4">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                  <td className="px-4 py-4">
                    <span className={`font-mono text-[9px] px-2 py-0.5 rounded border ${c.active ? "border-green-500/30 text-green-400/70" : "border-red-500/20 text-red-400/50"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => { void toggleActive(c.id, c.active); }}
                      className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#C6A55A]/60 hover:text-[#C6A55A] transition-colors"
                    >
                      {c.active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
