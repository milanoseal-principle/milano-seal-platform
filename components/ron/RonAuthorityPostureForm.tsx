"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Posture = {
  receiving_authority: string;
  receiving_authority_ron_acceptance: "accepted" | "not_accepted" | "unknown";
  wet_ink_requirement: "required" | "not_required" | "unknown";
  original_requirement: "required" | "not_required" | "unknown";
};

const selectClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-black/40 px-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none";

// Operator records the receiving-authority RON posture with its evidence
// basis. The server merges it into execution truth and writes an evidence
// ledger entry; nothing here marks RON ready by itself.
export function RonAuthorityPostureForm({ matterId, initial }: { matterId: string; initial: Posture }) {
  const router = useRouter();
  const [posture, setPosture] = useState<Posture>(initial);
  const [evidence, setEvidence] = useState("");
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Posture>(key: K, value: Posture[K]) =>
    setPosture((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/matters/${matterId}/ron-posture`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...posture, evidence_note: evidence }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.message ?? body.error ?? "RON posture was not saved.");
      toast.success("Receiving-authority RON posture recorded.");
      setEvidence("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "RON posture was not saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="mt-3 rounded-lg border border-white/[0.06] bg-black/20 p-3">
      <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.12em] text-[#C6A65B]/80">
        Record receiving-authority posture
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-[11px] text-white/45">
          Receiving authority
          <input className={selectClass} value={posture.receiving_authority} onChange={(e) => set("receiving_authority", e.target.value)} />
        </label>
        <label className="space-y-1 text-[11px] text-white/45">
          Accepts remote execution
          <select className={selectClass} value={posture.receiving_authority_ron_acceptance} onChange={(e) => set("receiving_authority_ron_acceptance", e.target.value as Posture["receiving_authority_ron_acceptance"])}>
            <option value="unknown">Unknown</option>
            <option value="accepted">Accepted (evidence recorded)</option>
            <option value="not_accepted">Not accepted</option>
          </select>
        </label>
        <label className="space-y-1 text-[11px] text-white/45">
          Wet-ink requirement
          <select className={selectClass} value={posture.wet_ink_requirement} onChange={(e) => set("wet_ink_requirement", e.target.value as Posture["wet_ink_requirement"])}>
            <option value="unknown">Unknown</option>
            <option value="not_required">Not required</option>
            <option value="required">Required</option>
          </select>
        </label>
        <label className="space-y-1 text-[11px] text-white/45">
          Original requirement
          <select className={selectClass} value={posture.original_requirement} onChange={(e) => set("original_requirement", e.target.value as Posture["original_requirement"])}>
            <option value="unknown">Unknown</option>
            <option value="not_required">Not required</option>
            <option value="required">Required</option>
          </select>
        </label>
      </div>
      <label className="mt-2 block space-y-1 text-[11px] text-white/45">
        Evidence basis (counsel instruction, authority source, written confirmation)
        <textarea className={`${selectClass} min-h-16 py-2`} value={evidence} onChange={(e) => setEvidence(e.target.value)} />
      </label>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving || evidence.trim().length < 10}
        className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-[#C6A65B] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving…" : "Record posture"}
      </button>
    </details>
  );
}
