"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const fieldClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-black/40 px-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none";

// Records a processing observation with its source. The server derives the
// confidence; only an official government source can be VERIFIED_SOURCE.
export function AuthorityObservationForm({ authorityId, serviceType }: { authorityId: string; serviceType: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ source_url: "", source_title: "", source_date: "", observed_processing_date: "", estimated_days: "", observation_method: "official_source", expires_in_days: "30", evidence_note: "" });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/state-authorities/${authorityId}/processing-observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          service_type: serviceType,
          estimated_days: Number(form.estimated_days),
          expires_in_days: Number(form.expires_in_days),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; observation?: { confidence?: string } };
      if (!response.ok) throw new Error(body.error ?? "Observation was not recorded.");
      toast.success(`Observation recorded · ${String(body.observation?.confidence ?? "").replace("_", " ").toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Observation was not recorded.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="mt-4 rounded-lg border border-white/[0.06] bg-black/20 p-3">
      <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.12em] text-[#C6A65B]/80">Record processing observation</summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input className={fieldClass} placeholder="Official source URL" value={form.source_url} onChange={(e) => set("source_url", e.target.value)} />
        <input className={fieldClass} placeholder="Source title" value={form.source_title} onChange={(e) => set("source_title", e.target.value)} />
        <label className="space-y-1 text-[11px] text-white/45">Source date<input type="date" className={fieldClass} value={form.source_date} onChange={(e) => set("source_date", e.target.value)} /></label>
        <label className="space-y-1 text-[11px] text-white/45">Processing date shown<input type="date" className={fieldClass} value={form.observed_processing_date} onChange={(e) => set("observed_processing_date", e.target.value)} /></label>
        <input className={fieldClass} inputMode="numeric" placeholder="Estimated days" value={form.estimated_days} onChange={(e) => set("estimated_days", e.target.value.replace(/[^0-9]/g, ""))} />
        <select className={fieldClass} value={form.observation_method} onChange={(e) => set("observation_method", e.target.value)}>
          <option value="official_source">Official source</option>
          <option value="operator_confirmed">Operator confirmed</option>
          <option value="observed_turnaround">Observed turnaround</option>
          <option value="other">Other (low confidence)</option>
        </select>
        <input className={fieldClass} inputMode="numeric" placeholder="Expires in days (max 120)" value={form.expires_in_days} onChange={(e) => set("expires_in_days", e.target.value.replace(/[^0-9]/g, ""))} />
        <textarea className={`${fieldClass} min-h-14 py-2 sm:col-span-2`} placeholder="Evidence basis" value={form.evidence_note} onChange={(e) => set("evidence_note", e.target.value)} />
      </div>
      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="mt-3 min-h-10 rounded-lg border border-[#C6A65B]/40 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6A65B] transition hover:bg-[#C6A65B]/10 disabled:opacity-40"
      >
        Record observation
      </button>
    </details>
  );
}
