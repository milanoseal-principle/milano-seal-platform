"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Facts = {
  route_type: string;
  document_count: string;
  government_fee_payment_method: string;
  return_shipment_mode: string;
};

const QA_ITEMS = [
  ["document_count_confirmed", "Document count"],
  ["official_form_confirmed", "Official form"],
  ["authority_confirmed", "Authority"],
  ["fees_confirmed", "Government fee"],
  ["payment_instrument_confirmed", "Fee payment instrument"],
  ["return_shipping_confirmed", "Return shipping"],
  ["destination_confirmed", "Destination"],
  ["paper_out_confirmed", "Paper-out"],
] as const;

const fieldClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-black/40 px-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none";
const buttonClass =
  "min-h-10 rounded-lg border border-[#C6A65B]/40 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6A65B] transition hover:bg-[#C6A65B]/10 disabled:opacity-40";

// Operator packet actions. Each is shown only when the server-computed status
// permits it, and the server recomputes readiness again before persisting.
export function AuthorityPacketActions({
  matterId,
  status,
  qaComplete,
  initial,
}: {
  matterId: string;
  status: string;
  qaComplete: boolean;
  initial: Facts;
}) {
  const router = useRouter();
  const [facts, setFacts] = useState<Facts>(initial);
  const [paperOutNotApplicable, setPaperOutNotApplicable] = useState(false);
  const [qa, setQa] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof Facts, value: string) => setFacts((current) => ({ ...current, [key]: value }));

  async function submit(action: "evaluate" | "assemble" | "qa" | "approve_dispatch") {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { action, evidence_note: note };
      if (action === "evaluate") {
        if (facts.route_type) payload.route_type = facts.route_type;
        if (facts.document_count) payload.document_count = Number(facts.document_count);
        payload.government_fee_payment_method = facts.government_fee_payment_method;
        payload.return_shipment_mode = facts.return_shipment_mode;
        if (paperOutNotApplicable) payload.paper_out_not_applicable = true;
      }
      if (action === "qa") payload.qa = qa;
      const response = await fetch(`/api/dashboard/matters/${matterId}/authority-packet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string; packet?: { packetStatus?: string } };
      if (!response.ok) throw new Error(body.message ?? body.error ?? "Packet step was not recorded.");
      toast.success(`Packet recorded · ${String(body.packet?.packetStatus ?? "refreshed").replaceAll("_", " ").toLowerCase()}`);
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Packet step was not recorded.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "READY_FOR_DISPATCH" || status === "DISPATCHED") return null;
  const canQa = status === "ASSEMBLED" && !qaComplete;
  const canApprove = status === "ASSEMBLED" && qaComplete;

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-white/[0.06] bg-black/20 p-3">
      {(status === "NOT_READY" || status === "REVIEW_REQUIRED" || status === "READY_TO_ASSEMBLE") && (
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1 text-[11px] text-white/45">
            Route
            <select className={fieldClass} value={facts.route_type} onChange={(e) => set("route_type", e.target.value)}>
              <option value="">Not resolved</option>
              <option value="florida_dos_apostille">Florida DOS apostille</option>
              <option value="florida_dos_notarial_certificate">Florida DOS notarial certificate</option>
            </select>
          </label>
          <label className="space-y-1 text-[11px] text-white/45">
            Document count
            <input className={fieldClass} inputMode="numeric" value={facts.document_count} onChange={(e) => set("document_count", e.target.value.replace(/[^0-9]/g, ""))} />
          </label>
          <label className="space-y-1 text-[11px] text-white/45">
            Government fee payment method
            <select className={fieldClass} value={facts.government_fee_payment_method} onChange={(e) => set("government_fee_payment_method", e.target.value)}>
              <option value="UNKNOWN">Unknown</option>
              <option value="REQUIRED">Required — not ready</option>
              <option value="READY">Ready</option>
              <option value="NOT_REQUIRED">Not required</option>
            </select>
          </label>
          <label className="space-y-1 text-[11px] text-white/45">
            Shipment arrangement
            <select className={fieldClass} value={facts.return_shipment_mode} onChange={(e) => set("return_shipment_mode", e.target.value)}>
              <option value="unknown">Unknown</option>
              <option value="outbound_only">Outbound only</option>
              <option value="outbound_prepaid_return">Outbound + prepaid return</option>
              <option value="manual_return">Manual return arrangement</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-white/60 sm:col-span-2">
            <input type="checkbox" checked={paperOutNotApplicable} onChange={(e) => setPaperOutNotApplicable(e.target.checked)} />
            Record paper-out as not applicable (evidence required)
          </label>
        </div>
      )}
      {canQa && (
        <div className="grid gap-2 sm:grid-cols-2">
          {QA_ITEMS.map(([key, name]) => (
            <label key={key} className="flex items-center gap-2 text-[11px] text-white/60">
              <input type="checkbox" checked={qa[key] === true} onChange={(e) => setQa((current) => ({ ...current, [key]: e.target.checked }))} />
              {name} confirmed
            </label>
          ))}
        </div>
      )}
      <label className="block space-y-1 text-[11px] text-white/45">
        Evidence basis / operator note
        <textarea
          className="min-h-16 w-full rounded-lg border border-white/[0.09] bg-black/40 p-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {status !== "ASSEMBLED" && (
          <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("evaluate")}>
            Refresh packet
          </button>
        )}
        {status === "READY_TO_ASSEMBLE" && (
          <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("assemble")}>
            Mark assembled
          </button>
        )}
        {canQa && (
          <button
            type="button"
            className={buttonClass}
            disabled={saving || !QA_ITEMS.every(([key]) => qa[key])}
            onClick={() => submit("qa")}
          >
            Complete QA
          </button>
        )}
        {canApprove && (
          <button type="button" className={buttonClass} disabled={saving} onClick={() => submit("approve_dispatch")}>
            Approve for dispatch
          </button>
        )}
      </div>
    </div>
  );
}
