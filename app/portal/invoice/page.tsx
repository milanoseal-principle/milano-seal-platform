"use client";

import { useEffect, useMemo, useState } from "react";
import { FinancialArtifactDownloads } from '@/components/portal/FinancialArtifactDownloads';
import { usePortal } from "@/components/portal/portal-context";

const GOLD = "#C6A55A";
const GREEN = "#4a9e6b";

interface InvoiceLineItem {
  key: string;
  label: string;
  amount: number;
  kind: string;
  discountable: boolean;
}

interface InvoiceSnapshot {
  matterId: string;
  displayId: string;
  currency: string;
  lineItems: InvoiceLineItem[];
  originalTotal: number;
  eligibleSubtotal: number;
  nonDiscountableTotal: number;
  discountAmount: number;
  discountPercent: number | null;
  finalTotal: number;
  retainer: number;
  balance: number;
  amountDueNow: number;
  paymentConfirmed: boolean;
  paymentStatus: string;
  wiseReference: string;
  wisePaymentUrl: string | null;
  courtesyApplied: boolean;
}

interface PaymentObservation {
  matterId: string;
  displayId: string;
  paymentStatus: string;
  settlementStatus: string;
  paymentConfirmed: boolean;
  paymentObservedAt: string | null;
  paymentConfirmedAt: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
}

function money(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function SummaryRow({ label, value, accent, strong }: { label: string; value: string; accent?: "green" | "gold"; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-white/[0.055] py-3 last:border-b-0">
      <span className="text-xs text-white/45">{label}</span>
      <span
        className="font-mono text-right"
        style={{
          fontSize: strong ? 16 : 13,
          fontWeight: strong ? 700 : 500,
          color: accent === "green" ? GREEN : accent === "gold" ? GOLD : "rgba(255,255,255,.78)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ClientInvoicePage() {
  const { deal, isLoading, refresh } = usePortal();
  const [invoice, setInvoice] = useState<InvoiceSnapshot | null>(null);
  const [paymentFlow, setPaymentFlow] = useState<PaymentObservation | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [discountBusy, setDiscountBusy] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [settlementCheckBusy, setSettlementCheckBusy] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);

  const loadInvoice = async () => {
    if (!deal?.id) return;
    setLoadingInvoice(true);
    try {
      const response = await fetch(`/api/portal/me/invoice?deal_id=${encodeURIComponent(deal.id)}`, { cache: "no-store" });
      const body = (await response.json()) as { invoice?: InvoiceSnapshot; error?: string };
      if (!response.ok || !body.invoice) throw new Error(body.error || "Invoice unavailable");
      setInvoice(body.invoice);
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : "Invoice unavailable");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const loadPaymentFlow = async (): Promise<PaymentObservation | null> => {
    if (!deal?.id) return null;
    try {
      const response = await fetch(`/api/portal/me/payment-observation?deal_id=${encodeURIComponent(deal.id)}`, { cache: "no-store" });
      const body = (await response.json()) as { payment?: PaymentObservation; error?: string };
      if (!response.ok || !body.payment) return null;
      setPaymentFlow((previous) => {
        if (!previous?.paymentConfirmed && body.payment?.paymentConfirmed) {
          void loadInvoice();
          void refresh();
        }
        return body.payment ?? previous;
      });
      return body.payment;
    } catch {
      // Polling is best-effort. The payment gate itself remains server authoritative.
      return null;
    }
  };

  useEffect(() => {
    void loadInvoice();
    void loadPaymentFlow();
    if (!deal?.id) return;
    const timer = window.setInterval(() => void loadPaymentFlow(), 10_000);
    const onFocus = () => void loadPaymentFlow();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.id]);

  const complimentaryAuthorized = useMemo(
    () => deal?.payment_disposition === "complimentary" && deal?.comp_authorized === true,
    [deal?.payment_disposition, deal?.comp_authorized],
  );

  async function applyDiscount() {
    if (!deal?.id || !discountCode.trim() || discountBusy) return;
    setDiscountBusy(true);
    setDiscountError(null);
    setDiscountSuccess(null);
    try {
      const response = await fetch("/api/portal/me/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: deal.id, code: discountCode.trim().toUpperCase() }),
      });
      const body = (await response.json()) as { invoice?: InvoiceSnapshot; error?: string };
      if (!response.ok || !body.invoice) throw new Error(body.error || "Discount could not be applied");
      setInvoice(body.invoice);
      setDiscountSuccess("Discount applied. Your final total and 50% retainer have been recalculated before payment.");
      setDiscountCode("");
      await refresh();
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : "Discount could not be applied");
    } finally {
      setDiscountBusy(false);
    }
  }

  async function markWiseSubmitted() {
    if (!deal?.id || paymentBusy) return;
    setPaymentBusy(true);
    setPaymentMessage(null);
    try {
      const response = await fetch("/api/portal/me/payment-observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: deal.id }),
      });
      const body = (await response.json()) as { payment?: PaymentObservation; message?: string; error?: string };
      if (!response.ok || !body.payment) throw new Error(body.error || "Payment submission could not be recorded.");
      setPaymentFlow(body.payment);
      setPaymentMessage(body.message || "Payment submitted successfully. Settlement verification continues in the background.");
      await refresh();
    } catch (err) {
      setPaymentMessage(err instanceof Error ? err.message : "Payment submission could not be recorded.");
    } finally {
      setPaymentBusy(false);
    }
  }

  async function checkWiseSettlement() {
    if (!deal?.id || settlementCheckBusy) return;
    setSettlementCheckBusy(true);
    setPaymentMessage("Checking Wise settlement…");
    try {
      const response = await fetch("/api/portal/me/payment-observation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: deal.id }),
      });
      const body = (await response.json().catch(() => ({}))) as { payment?: PaymentObservation; message?: string; error?: string };
      if (!response.ok || !body.payment) {
        setPaymentMessage(body.error || "Settlement could not be checked right now. Automatic checks will continue.");
        return;
      }
      setPaymentFlow(body.payment);
      setPaymentMessage(body.message || (body.payment.paymentConfirmed
        ? "Wise settlement verified. Paid state is confirmed."
        : "Payment submission remains recorded. Settlement continues in the background."));
      await loadInvoice();
      await refresh();
    } finally {
      setSettlementCheckBusy(false);
    }
  }

  if (isLoading || loadingInvoice) {
    return <div className="text-sm text-white/40">Verifying invoice state…</div>;
  }

  if (!deal || !invoice) {
    return <div className="text-sm text-white/50">No invoice is available for this account.</div>;
  }

  const currency = invoice.currency || "USD";
  const paymentConfirmed = invoice.paymentConfirmed || Boolean(paymentFlow?.paymentConfirmed);
  const paymentProcessing = !paymentConfirmed && Boolean(paymentFlow?.paymentObservedAt);

  if (complimentaryAuthorized) {
    return (
      <div className="max-w-4xl">
        <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">Invoice & Authorization</div>
        <h1 className="mt-2 font-serif text-3xl text-white">Complimentary Service Authorization</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">No payment is due for this Matter. Complimentary authorization remains separate from Wise paid-state authority.</p>
        <div className="mt-7 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.04] p-6">
          <SummaryRow label="Original service value" value={money(invoice.originalTotal, currency)} />
          <SummaryRow label="Authorized amount due" value={money(0, currency)} strong accent="green" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">Invoice & Payment Authorization</div>
      <h1 className="mt-2 font-serif text-3xl text-white">Your Matter Invoice</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
        Review every client-facing charge before payment. An authorized discount recalculates the final Matter total, 50% retainer, remaining balance, and Wise payment amount before you leave this screen.
      </p>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-xl border border-[#C6A55A]/20 bg-white/[0.012]">
          <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/65">Itemized Order</div>
            <div className="mt-1 text-xs text-white/35">Matter {invoice.displayId}</div>
          </div>
          <div className="px-5 py-2 sm:px-6">
            {invoice.lineItems.map((item) => (
              <div key={item.key} className="flex items-start justify-between gap-6 border-b border-white/[0.055] py-4 last:border-b-0">
                <div>
                  <div className="text-sm text-white/78">{item.label}</div>
                  <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/27">
                    {item.discountable ? "Execution / service" : "Pass-through / delivery"}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-sm text-[#E6D39B]">{money(item.amount, currency)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#C6A55A]/20 bg-[linear-gradient(180deg,rgba(198,165,90,.055),rgba(0,0,0,.18))] p-5 sm:p-6">
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/65">Payment Summary</div>
          <div className="mt-3">
            <SummaryRow label="Original Matter total" value={money(invoice.originalTotal, currency)} />
            <SummaryRow label="Discount-eligible service subtotal" value={money(invoice.eligibleSubtotal, currency)} />
            {invoice.nonDiscountableTotal > 0 && (
              <SummaryRow label="Pass-through / delivery total" value={money(invoice.nonDiscountableTotal, currency)} />
            )}
            {invoice.discountAmount > 0 && (
              <SummaryRow
                label={`Authorized discount${invoice.discountPercent ? ` · ${invoice.discountPercent}%` : ""}`}
                value={`−${money(invoice.discountAmount, currency)}`}
                accent="green"
              />
            )}
            <SummaryRow label="Final Matter total" value={money(invoice.finalTotal, currency)} accent="gold" strong />
            <SummaryRow label="50% retainer due now" value={money(invoice.retainer, currency)} />
            <SummaryRow label="Remaining balance" value={money(invoice.balance, currency)} />
          </div>

          {!paymentConfirmed && !paymentProcessing && (
            <div className="mt-5 rounded-lg border border-white/[0.075] bg-black/20 p-4">
              <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Discount / Courtesy Code</div>
              {invoice.courtesyApplied ? (
                <div className="mt-2 text-sm text-emerald-300/80">An authorized discount is already applied to this Matter.</div>
              ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={discountCode}
                    onChange={(event) => { setDiscountCode(event.target.value.toUpperCase()); setDiscountError(null); setDiscountSuccess(null); }}
                    placeholder="Enter code"
                    autoCapitalize="characters"
                    className="min-h-11 min-w-0 flex-1 rounded-md border border-[#C6A55A]/20 bg-[#070707] px-3 font-mono text-sm uppercase tracking-[0.08em] text-white outline-none placeholder:text-white/20 focus:border-[#C6A55A]/55"
                  />
                  <button
                    type="button"
                    onClick={() => void applyDiscount()}
                    disabled={discountBusy || !discountCode.trim()}
                    className="min-h-11 rounded-md bg-[#C6A55A] px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#090806] transition hover:bg-[#D7B96E] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {discountBusy ? "Applying…" : "Apply"}
                  </button>
                </div>
              )}
              {discountError && <div className="mt-3 text-xs leading-5 text-red-300">{discountError}</div>}
              {discountSuccess && <div className="mt-3 text-xs leading-5 text-emerald-300/80">{discountSuccess}</div>}
            </div>
          )}

          <div className={`mt-5 rounded-lg border p-4 ${paymentConfirmed ? "border-emerald-400/25 bg-emerald-400/[0.05]" : paymentProcessing ? "border-amber-300/25 bg-amber-300/[0.04]" : "border-[#C6A55A]/25 bg-[#C6A55A]/[0.055]"}`}>
            <div className={`font-mono text-[8px] uppercase tracking-[0.17em] ${paymentConfirmed ? "text-emerald-300/75" : "text-[#C6A55A]/70"}`}>
              {paymentConfirmed ? "Verified Wise payment" : paymentProcessing ? "Payment submitted" : "Amount due before scheduling"}
            </div>
            <div className="mt-1 font-serif text-3xl text-white">
              {paymentConfirmed ? money(paymentFlow?.amountPaid || invoice.retainer, currency) : money(invoice.amountDueNow, currency)}
            </div>
            <div className="mt-2 text-[11px] leading-5 text-white/38">Wise reference: <span className="font-mono text-[#C6A55A]/75">{invoice.wiseReference}</span></div>
            {paymentProcessing && (
              <div className="mt-3 text-xs leading-5 text-amber-100/60">
                Your payment submission is recorded. Your Matter remains active while Wise completes settlement in the background. You do not need to submit payment again. Scheduling may proceed only after the recorded submission passes canonical integrity checks and the remaining Matter requirements are ready.
              </div>
            )}
          </div>

          {!paymentConfirmed && !paymentProcessing && invoice.amountDueNow > 0 && (
            <div className="mt-5 space-y-3">
              {invoice.wisePaymentUrl ? (
                <a
                  href={invoice.wisePaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#C6A55A] px-5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#090806] transition hover:bg-[#D7B96E]"
                >
                  Pay {money(invoice.amountDueNow, currency)} with Wise →
                </a>
              ) : (
                <div className="text-xs leading-5 text-white/40">The Matter-specific Wise payment link is being prepared. Scheduling remains unavailable until the payment requirement is satisfied.</div>
              )}
              <button
                type="button"
                onClick={() => void markWiseSubmitted()}
                disabled={paymentBusy}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#C6A55A]/25 bg-transparent px-4 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-[#E6D39B] transition hover:border-[#C6A55A]/50 disabled:opacity-40"
              >
                {paymentBusy ? "Recording…" : "I completed payment in Wise"}
              </button>
              <div className="text-[10px] leading-4 text-white/28">This records the Wise submission as processing only after a secure Milano-to-Wise handoff. It does not mark the Matter paid.</div>
            </div>
          )}

          {paymentProcessing && (
            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => void checkWiseSettlement()}
                disabled={settlementCheckBusy}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#C6A55A]/25 px-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[#E6D39B] transition hover:border-[#C6A55A]/50 disabled:cursor-wait disabled:opacity-50"
              >
                {settlementCheckBusy ? "Checking…" : "Check Wise settlement now"}
              </button>
              <div className="text-[10px] leading-4 text-white/28">This performs a live server-side Wise reconciliation. Settlement remains distinct from your recorded submission and verified paid state.</div>
            </div>
          )}

          {paymentConfirmed && (
            <div className="mt-5 rounded-lg border border-emerald-400/25 bg-emerald-400/[0.05] p-4 text-sm text-emerald-300/85">Payment verified. Paid state is confirmed and all verified-payment-only release controls may proceed.</div>
          )}

          {paymentMessage && <div className="mt-4 rounded-md border border-white/[0.07] bg-white/[0.02] p-3 text-xs leading-5 text-white/55">{paymentMessage}</div>}
        </section>
      </div>

      <p className="mt-5 text-[11px] leading-5 text-white/30">
        A submitted Wise payment remains processing and never marks a Matter paid. Verified Wise settlement is required before scheduling, execution, or final settlement-dependent release.
      </p>
      <FinancialArtifactDownloads matterId={deal.id} />
    </div>
  );
}
