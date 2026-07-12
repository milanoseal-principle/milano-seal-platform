"use client";

import { useState } from "react";
import { COMPLIMENTARY_CONFIRMATION, COMPLIMENTARY_REASON_LABELS, type ComplimentaryReasonCode } from "@/lib/payments/complimentary-policy";
import { ComplimentaryReasonSelect } from "./ComplimentaryReasonSelect";
import { ComplimentarySummary } from "./ComplimentarySummary";

export function ComplimentaryAuthorizationDialog({ matterId, quoteId, originalValue, onAuthorized }: { matterId: string; quoteId?: string | null; originalValue: number; onAuthorized?: () => void }) {
  const [reasonCode, setReasonCode] = useState<ComplimentaryReasonCode>("founder_authorized");
  const [reasonDetail, setReasonDetail] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function authorize() {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/matters/${matterId}/complimentary/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quoteId ?? null, reasonCode, reasonDetail, confirmation }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Authorization failed.");
      setMessage("Complimentary Matter Authorized. Amount due is $0 and verified revenue remains $0.");
      onAuthorized?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authorization failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = confirmation === COMPLIMENTARY_CONFIRMATION && reasonDetail.trim().length >= 12 && !submitting;

  return (
    <div className="grid gap-4 rounded-3xl border border-[#8d6a22]/30 bg-[#090909]/95 p-5 text-neutral-200 shadow-2xl sm:p-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#c99a3a]">Payment Disposition</p>
        <h3 className="mt-1 font-serif text-2xl text-[#f4e5b8]">Authorize 100% Complimentary Matter</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-400">This action sets the amount due to $0 for this Matter. It does not create a payment, Wise transaction, or verified revenue. The authorization will be recorded permanently.</p>
      </div>
      <ComplimentarySummary originalValue={originalValue} authorized={false} reasonLabel={COMPLIMENTARY_REASON_LABELS[reasonCode]} />
      <ComplimentaryReasonSelect value={reasonCode} onChange={setReasonCode} />
      <label className="grid gap-2 text-sm text-neutral-300">
        Required explanation
        <textarea value={reasonDetail} onChange={(event) => setReasonDetail(event.target.value)} className="min-h-24 rounded-xl border border-[#8d6a22]/40 bg-black/40 p-3 text-sm text-[#f4e5b8] outline-none" placeholder="Founder-approved pilot Matter for verified strategic partner." />
      </label>
      <label className="grid gap-2 text-sm text-neutral-300">
        Type exactly: AUTHORIZE COMPLIMENTARY MATTER
        <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="min-h-11 rounded-xl border border-[#8d6a22]/40 bg-black/40 px-3 font-mono text-sm text-[#f4e5b8] outline-none" />
      </label>
      {message ? <p className="rounded-xl border border-[#8d6a22]/30 bg-black/30 p-3 text-sm text-[#e3bd65]">{message}</p> : null}
      <button disabled={!canSubmit} onClick={authorize} className="min-h-12 rounded-xl border border-[#c99a3a]/50 bg-[#c99a3a]/15 px-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#f4e5b8] disabled:cursor-not-allowed disabled:opacity-40">
        {submitting ? "Authorizing..." : "Authorize 100% Complimentary Matter"}
      </button>
    </div>
  );
}
