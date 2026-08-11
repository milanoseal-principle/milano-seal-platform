"use client";

import { useState } from "react";
import { BadgeCheck, ChevronDown, Copy, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number.isFinite(value) ? value : 0);
}

export interface SecurePaymentDeal {
  id: string;
  deal_id: string;
  lane: string;
  total_price: number;
  original_total?: number | null;
  discount_code?: string | null;
  discount_amount?: number | null;
  final_total?: number | null;
  invoice_retainer?: number | null;
  invoice_balance?: number | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  payment_status: string;
  payment_link?: string | null;
  payment_disposition?: string | null;
}

export function SecurePaymentCard({ deal, onRefresh }: { deal: SecurePaymentDeal; onRefresh?: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const original = Number(deal.original_total ?? deal.total_price ?? 0);
  const discount = Number(deal.discount_amount ?? 0);
  const adjusted = Number(deal.final_total ?? deal.total_price ?? 0);
  const due = Number(deal.amount_due ?? deal.invoice_retainer ?? 0);
  const balance = Number(deal.invoice_balance ?? Math.max(0, adjusted - due));
  const isPaid = deal.payment_status === "paid";
  const isComplimentary = deal.payment_disposition === "complimentary";

  async function applyDiscount() {
    const normalized = code.trim();
    if (!normalized || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body.error ?? "Code could not be applied.");
        return;
      }
      setCode("");
      toast.success("Courtesy code applied.");
      onRefresh?.();
    } catch {
      toast.error("Could not apply code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#C6A55A]/25 bg-[linear-gradient(180deg,#11110f_0%,#090909_100%)] shadow-[0_22px_80px_rgba(0,0,0,.32)]">
      <div className="border-b border-[#C6A55A]/10 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-[#C6A55A]">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Payment
            </div>
            <h3 className="mt-2 font-serif text-2xl text-[#F6F1E6]">{deal.lane} Lane</h3>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${isPaid ? "border-emerald-400/25 bg-emerald-400/8 text-emerald-300" : "border-[#C6A55A]/25 bg-[#C6A55A]/8 text-[#E8CF8B]"}`}>
            {isPaid ? "Paid" : "Awaiting Payment"}
          </span>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {!isComplimentary && !isPaid && (
          <div className="rounded-lg border border-[#C6A55A]/12 bg-black/20 p-3">
            <label htmlFor={`discount-${deal.id}`} className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#A8A29A]">Partner or Courtesy Code</label>
            <div className="mt-2 flex gap-2">
              <input
                id={`discount-${deal.id}`}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === "Enter") void applyDiscount(); }}
                placeholder="Enter code"
                autoComplete="off"
                className="min-h-11 min-w-0 flex-1 rounded-md border border-[#C6A55A]/15 bg-[#080808] px-3 text-sm text-[#F6F1E6] outline-none transition focus:border-[#C6A55A]/45"
              />
              <button
                type="button"
                disabled={!code.trim() || busy}
                onClick={() => void applyDiscount()}
                className="min-h-11 rounded-md border border-[#C6A55A]/35 bg-[#C6A55A]/10 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#F6E8B8] transition hover:bg-[#C6A55A]/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Applying…" : "Apply"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm text-[#A8A29A]"><span>Matter Value</span><span className="text-[#F6F1E6]">{money(original)}</span></div>
          {discount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm text-[#A8A29A]"><span>Courtesy Code {deal.discount_code ? `· ${deal.discount_code}` : ""}</span><span className="text-[#E6C56E]">-{money(discount)}</span></div>
              <div className="flex items-center justify-between text-sm text-[#A8A29A]"><span>Adjusted Matter Value</span><span className="text-[#F6F1E6]">{money(adjusted)}</span></div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-[#C6A55A]/25 bg-[#C6A55A]/[0.045] p-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.02)]">
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#A8A29A]">Due Now</div>
          <div className="mt-2 font-serif text-4xl text-[#E8CF8B]">{money(due)}</div>
          <div className="mt-1 text-xs text-[#8e897f]">50% retainer to begin execution</div>
          {!isPaid && !isComplimentary && deal.payment_link && (
            <a href={deal.payment_link} target="_blank" rel="noreferrer" className="mt-5 flex min-h-12 w-full items-center justify-center rounded-md bg-[#C6A55A] px-5 text-xs font-bold uppercase tracking-[0.14em] text-[#090909] transition duration-200 hover:-translate-y-px hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[#C6A55A]/50">
              Complete Secure Payment
            </a>
          )}
          {isPaid && <div className="mt-5 flex items-center justify-center gap-2 text-sm text-emerald-300"><BadgeCheck className="h-4 w-4" /> Payment verified</div>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/5 bg-white/[0.015] p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-[#777169]">Remaining balance</div><div className="mt-1 text-lg text-[#F6F1E6]">{money(balance)}</div><div className="mt-1 text-[11px] text-[#777169]">Due before final release</div></div>
          <div className="rounded-lg border border-white/5 bg-white/[0.015] p-3"><div className="text-[10px] uppercase tracking-[0.14em] text-[#777169]">Amount paid</div><div className="mt-1 text-lg text-[#F6F1E6]">{money(Number(deal.amount_paid ?? 0))}</div><div className="mt-1 text-[11px] text-[#777169]">Wise verified only</div></div>
        </div>

        {!isPaid && !isComplimentary && <div className="flex gap-2 rounded-lg border border-[#C6A55A]/10 bg-black/20 p-3 text-xs leading-5 text-[#938d83]"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C6A55A]" /> Your Matter remains reserved. Scheduling unlocks automatically after verified payment.</div>}

        <div className="border-t border-[#C6A55A]/10 pt-3">
          <button type="button" onClick={() => setAdvancedOpen((v) => !v)} className="flex w-full items-center justify-between text-xs text-[#7f796f] hover:text-[#B8B1A6]">
            <span>Advanced payment details</span><ChevronDown className={`h-4 w-4 transition ${advancedOpen ? "rotate-180" : ""}`} />
          </button>
          {advancedOpen && (
            <div className="mt-3 space-y-3 rounded-lg border border-white/5 bg-black/20 p-3 text-xs text-[#8e897f]">
              <div className="flex items-center justify-between gap-3"><span>Powered by Wise Business</span><span className="font-mono text-[#B7A97D]">{deal.deal_id}</span></div>
              {deal.payment_link && <div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded bg-black/30 p-2 text-[10px] text-[#777169]">{deal.payment_link}</code><button onClick={() => { navigator.clipboard.writeText(deal.payment_link!); toast.success("Copied"); }}><Copy className="h-4 w-4" /></button><a href={deal.payment_link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></div>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
