"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type RateOption = {
  rate_id: string;
  carrier: string;
  service: string;
  amount: string;
  currency: string;
  estimated_days: number | null;
  rank: number;
  recommended: boolean;
  selection_reason: string;
};

type LegSummary = {
  id: string;
  legType: string;
  labelStatus: string;
  custodyStatus: string;
  shipped: boolean;
  labelAvailable: boolean;
  trackingUrl: string | null;
};

const fieldClass =
  "min-h-10 w-full rounded-lg border border-white/[0.09] bg-black/40 px-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none";
const buttonClass =
  "min-h-10 rounded-lg border border-[#C6A65B]/40 px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6A65B] transition hover:bg-[#C6A65B]/10 disabled:opacity-40";

const ADDRESS_KEYS = ["name", "street1", "city", "state", "zip", "country"] as const;

// Gated operator actions for shipment legs. Every action is re-validated by
// the server against canonical truth; nothing here reports success unless the
// server persisted it.
export function AuthorityLogisticsActions(props: {
  matterId: string;
  mode: "create" | "leg";
  leg?: LegSummary;
  create?: { canCreateOutbound: boolean; canCreateReturn: boolean };
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState<Record<string, string>>({});
  const [exceptionReason, setExceptionReason] = useState("");
  const [finalType, setFinalType] = useState("final_international");
  const [quote, setQuote] = useState<{ ref: string; rates: RateOption[] } | null>(null);
  const base = `/api/deals/${props.matterId}/shipment-legs`;

  async function call(url: string, body: Record<string, unknown>, success: string) {
    setBusy(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence_note: note, ...body }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        reasons?: string[];
        rates?: RateOption[];
        provider_shipment_ref?: string;
      };
      if (!response.ok) throw new Error([payload.error, ...(payload.reasons ?? [])].filter(Boolean).join(" — ") || "Action was not recorded.");
      if (payload.rates && payload.provider_shipment_ref) {
        setQuote({ ref: payload.provider_shipment_ref, rates: payload.rates });
        toast.success("Governed rates loaded.");
      } else {
        toast.success(success);
        setNote("");
        setQuote(null);
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action was not recorded.");
    } finally {
      setBusy(false);
    }
  }

  const noteField = (
    <label className="block space-y-1 text-[11px] text-white/45">
      Evidence basis
      <textarea
        className="min-h-14 w-full rounded-lg border border-white/[0.09] bg-black/40 p-3 text-xs text-[#F6F1E6] focus:border-[#C6A65B]/45 focus:outline-none"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </label>
  );

  if (props.mode === "create") {
    const create = props.create!;
    return (
      <details className="mt-4 rounded-lg border border-white/[0.06] bg-black/20 p-3">
        <summary className="cursor-pointer font-mono text-[9px] uppercase tracking-[0.12em] text-[#C6A65B]/80">Create shipment leg</summary>
        <div className="mt-3 space-y-3">
          <p className="text-[11px] text-white/45">Authority / recipient address (operator-entered from official or client records):</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {ADDRESS_KEYS.map((key) => (
              <input
                key={key}
                className={fieldClass}
                placeholder={key}
                value={address[key] ?? ""}
                onChange={(e) => setAddress((current) => ({ ...current, [key]: e.target.value }))}
              />
            ))}
          </div>
          <input className={fieldClass} placeholder="Exception reason (exception returns only)" value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} />
          {noteField}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={buttonClass} disabled={busy || !create.canCreateOutbound} onClick={() => call(base, { leg_type: "outbound_to_authority", destination: address }, "Outbound leg created.")}>
              Create outbound leg
            </button>
            <button type="button" className={buttonClass} disabled={busy || !create.canCreateReturn} onClick={() => call(base, { leg_type: "return_from_authority", explicit_return_request: true }, "Return leg created.")}>
              Create return leg
            </button>
            <select className={`${fieldClass} w-auto`} value={finalType} onChange={(e) => setFinalType(e.target.value)}>
              <option value="final_international">Final international</option>
              <option value="final_to_client">Final to client</option>
            </select>
            <button type="button" className={buttonClass} disabled={busy} onClick={() => call(base, { leg_type: finalType, release_action_confirmed: true, ...(address.street1 ? { destination: address } : {}) }, "Final leg created.")}>
              Create final leg
            </button>
            <button type="button" className={buttonClass} disabled={busy} onClick={() => call(base, { leg_type: "exception_return", exception_reason: exceptionReason, destination: address }, "Exception return created.")}>
              Create exception return
            </button>
          </div>
        </div>
      </details>
    );
  }

  const leg = props.leg!;
  const legUrl = `${base}/${leg.id}`;
  const canRate = ["not_created", "rate_selected", "voided", "error"].includes(leg.labelStatus);
  const canPurchase = leg.labelStatus === "rate_selected";
  const isReturn = leg.legType === "return_from_authority";
  const isFinal = leg.legType.startsWith("final_");
  const canDispatch = leg.labelStatus === "created" && !isReturn && ["not_started", "prepared", "handoff_ready"].includes(leg.custodyStatus);

  return (
    <div className="mt-3 space-y-2">
      {quote && (
        <ul className="space-y-1.5">
          {quote.rates.map((rate) => (
            <li key={rate.rate_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-[11px] text-white/70">
              <span>
                #{rate.rank} {rate.carrier} · {rate.service} · {rate.amount} {rate.currency}
                {rate.estimated_days !== null ? ` · ${rate.estimated_days}d` : ""}
                {rate.recommended ? " · recommended" : ""}
              </span>
              <button type="button" className={buttonClass} disabled={busy} onClick={() => call(`${legUrl}/rates`, { action: "select", provider_shipment_ref: quote.ref, selected_rate_id: rate.rate_id }, "Rate snapshot persisted.")}>
                Select
              </button>
            </li>
          ))}
        </ul>
      )}
      {(canRate || canPurchase || canDispatch || leg.labelStatus === "created") && noteField}
      <div className="flex flex-wrap gap-2">
        {canRate && (
          <button type="button" className={buttonClass} disabled={busy} onClick={() => call(`${legUrl}/rates`, { action: "quote" }, "Rates loaded.")}>
            Select rate
          </button>
        )}
        {canPurchase && !isReturn && (
          <button type="button" className={buttonClass} disabled={busy} onClick={() => call(`${legUrl}/label`, { action: "purchase", operator_authorized: true, ...(isFinal ? { release_action_confirmed: true } : {}) }, "Label purchased.")}>
            Purchase label
          </button>
        )}
        {canPurchase && isReturn && (
          <button type="button" className={buttonClass} disabled={busy} onClick={() => call(`${legUrl}/label`, { action: "purchase", explicit_return_label_request: true }, "Return label purchased.")}>
            Generate return label
          </button>
        )}
        {canDispatch && (
          <button type="button" className={buttonClass} disabled={busy} onClick={() => call(`${legUrl}/dispatch`, isFinal ? { release_action_confirmed: true } : {}, "Dispatch confirmed.")}>
            Confirm dispatch
          </button>
        )}
        {leg.labelAvailable && (
          <a className={buttonClass + " inline-flex items-center"} href={`${legUrl}/label`} target="_blank" rel="noreferrer">
            Print label
          </a>
        )}
        {leg.trackingUrl && (
          <a className={buttonClass + " inline-flex items-center"} href={leg.trackingUrl} target="_blank" rel="noreferrer">
            Open tracking
          </a>
        )}
        {leg.labelStatus === "created" && !leg.shipped && (
          <button type="button" className={buttonClass} disabled={busy} onClick={() => call(`${legUrl}/label`, { action: "void" }, "Label voided.")}>
            Void label
          </button>
        )}
      </div>
    </div>
  );
}
