"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Facts = {
  route_type: string;
  document_count: string;
  destination_confirmed: boolean;
  government_fee_method_status: "ready" | "not_ready" | "unknown";
  return_shipping: "required" | "not_required" | "unknown";
};

const fieldClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-black/40 px-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none";
const buttonClass =
  "min-h-10 rounded-lg border border-[#C6A65B]/40 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6A65B] transition hover:bg-[#C6A65B]/10 disabled:opacity-40";

// BUILD AUTHORITY PACKET. The operator records packet facts; the server
// recomputes readiness from canonical evidence for every lifecycle step.
export function AuthorityPacketActions({
  matterId,
  status,
  initial,
}: {
  matterId: string;
  status: string;
  initial: Facts;
}) {
  const router = useRouter();
  const [facts, setFacts] = useState<Facts>(initial);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Facts>(key: K, value: Facts[K]) => setFacts((current) => ({ ...current, [key]: value }));

  async function submit(action: "build" | "assemble" | "approve") {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { action, evidence_note: note };
      if (action === "build") {
        payload.route_type = facts.route_type;
        payload.destination_confirmed = facts.destination_confirmed;
        payload.government_fee_method_status = facts.government_fee_method_status;
        payload.return_shipping = facts.return_shipping;
        if (facts.document_count) payload.document_count = Number(facts.document_count);
      }
      const response = await fetch(`/api/dashboard/matters/${matterId}/authority-packet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) throw new Error(body.message ?? body.error ?? "Packet step was not recorded.");
      toast.success("Authority packet updated.");
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Packet step was not recorded.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "READY_FOR_DISPATCH" || status === "DISPATCHED") return null;

  return (
    <details className="mt-4 rounded-lg border border-white/[0.06] bg-black/20 p-3" open={status === "READY_TO_ASSEMBLE" || status === "ASSEMBLED"}>
      <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.12em] text-[#C6A65B]/80">
        Build authority packet
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-[11px] text-white/45">
          Route
          <select className={fieldClass} value={facts.route_type} onChange={(e) => set("route_type", e.target.value)}>
            <option value="florida_dos_apostille">Florida DOS apostille</option>
            <option value="florida_dos_notarial_certificate">Florida DOS notarial certificate</option>
            <option value="other">Other (operator review)</option>
          </select>
        </label>
        <label className="space-y-1 text-[11px] text-white/45">
          Document count
          <input
            className={fieldClass}
            inputMode="numeric"
            value={facts.document_count}
            onChange={(e) => set("document_count", e.target.value.replace(/[^0-9]/g, ""))}
          />
        </label>
        <label className="space-y-1 text-[11px] text-white/45">
          Government fee payment method
          <select
            className={fieldClass}
            value={facts.government_fee_method_status}
            onChange={(e) => set("government_fee_method_status", e.target.value as Facts["government_fee_method_status"])}
          >
            <option value="unknown">Unknown</option>
            <option value="ready">Ready</option>
            <option value="not_ready">Not ready</option>
          </select>
        </label>
        <label className="space-y-1 text-[11px] text-white/45">
          Return envelope
          <select
            className={fieldClass}
            value={facts.return_shipping}
            onChange={(e) => set("return_shipping", e.target.value as Facts["return_shipping"])}
          >
            <option value="unknown">Unresolved</option>
            <option value="required">Required</option>
            <option value="not_required">Not required</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-[11px] text-white/60 sm:col-span-2">
          <input
            type="checkbox"
            checked={facts.destination_confirmed}
            onChange={(e) => set("destination_confirmed", e.target.checked)}
          />
          Destination confirmed
        </label>
        <label className="space-y-1 text-[11px] text-white/45 sm:col-span-2">
          Evidence basis
          <textarea
            className="min-h-16 w-full rounded-lg border border-white/[0.09] bg-black/40 p-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("build")}>
          Record packet facts
        </button>
        {status === "READY_TO_ASSEMBLE" && (
          <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("assemble")}>
            Mark assembled
          </button>
        )}
        {status === "ASSEMBLED" && (
          <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("approve")}>
            Record final QA
          </button>
        )}
      </div>
    </details>
  );
}
