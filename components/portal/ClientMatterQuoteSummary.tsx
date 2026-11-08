"use client";

import { useEffect, useState } from "react";

type Line = {
  key: string;
  label: string;
  amount: number;
  kind: string;
  discountable: boolean;
};

type Invoice = {
  matterId: string;
  displayId: string;
  currency: string;
  matterPricingType: string | null;
  executionMethod: string | null;
  pricingVersion: string | null;
  lineItems: Line[];
  originalTotal: number;
  eligibleSubtotal: number;
  nonDiscountableTotal: number;
  discountAmount: number;
  finalTotal: number;
  retainer: number;
  balance: number;
  amountDueNow: number;
  paymentConfirmed: boolean;
  paymentStatus: string;
  courtesyApplied: boolean;
  thirdPartyTimingNotice: string;
};

const money = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(value || 0));

const humanize = (value: string | null) =>
  value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "To be confirmed";

export function ClientMatterQuoteSummary({ matterId }: { matterId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(
          `/api/portal/me/invoice?deal_id=${encodeURIComponent(matterId)}`,
          { cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) return;
        const body = (await response.json()) as { invoice?: Invoice };
        setInvoice(body.invoice ?? null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [matterId]);

  if (loading) {
    return (
      <section className="rounded-sm border border-[#C6A55A]/15 bg-black/20 p-5" role="status">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C6A55A]/60">
          Loading Matter Summary…
        </div>
      </section>
    );
  }

  if (!invoice) return null;

  return (
    <section className="overflow-hidden rounded-sm border border-[#C6A55A]/20 bg-[#0b0b0b]">
      <header className="border-b border-[#C6A55A]/15 px-5 py-4">
        <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-[#C6A55A]/60">
          Reviewed Matter Summary
        </div>
        <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">
          Scope, execution and payment
        </h2>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45">
          This is the reviewed scope for your Matter. It is not a public rate card. The Milano Seal does not provide legal advice. Your attorney and the receiving authority retain their respective review responsibilities.
        </p>
      </header>

      <div className="grid gap-0 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
        <div className="space-y-4 p-5 md:border-r md:border-[#C6A55A]/12">
          <div className="grid gap-3 sm:grid-cols-2">
            <Meta label="Matter type" value={humanize(invoice.matterPricingType)} />
            <Meta label="Execution method" value={humanize(invoice.executionMethod)} />
          </div>

          <div>
            <div className="mb-2 text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">
              Included and approved services
            </div>
            <div className="divide-y divide-white/8 rounded-sm border border-white/8">
              {invoice.lineItems.map((line) => (
                <div key={line.key} className="flex items-start justify-between gap-4 px-3 py-3">
                  <div>
                    <div className="text-sm text-[#F6F1E6]">{line.label}</div>
                    <div className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-white/30">
                      {line.kind}
                      {!line.discountable ? " · pass-through" : ""}
                    </div>
                  </div>
                  <div className="font-mono text-sm text-[#F6F1E6]">
                    {money(line.amount, invoice.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-amber-400/15 bg-amber-400/[0.03] p-3 text-[11px] leading-5 text-white/45">
            {invoice.thirdPartyTimingNotice}
          </div>
        </div>

        <div className="space-y-3 bg-[#C6A55A]/[0.025] p-5">
          <Amount label="Matter total" value={money(invoice.finalTotal, invoice.currency)} emphasis />
          {invoice.discountAmount > 0 && (
            <>
              <Amount label="Reviewed subtotal" value={money(invoice.originalTotal, invoice.currency)} />
              <Amount label="Approved courtesy adjustment" value={`−${money(invoice.discountAmount, invoice.currency)}`} />
            </>
          )}
          <div className="my-2 h-px bg-[#C6A55A]/15" />
          <Amount label="50% deposit" value={money(invoice.retainer, invoice.currency)} emphasis />
          <Amount label="Final balance" value={money(invoice.balance, invoice.currency)} emphasis />
          <Amount
            label="Due now"
            value={invoice.paymentConfirmed ? "Confirmed" : money(invoice.amountDueNow, invoice.currency)}
            emphasis
          />
          <p className="pt-2 text-[10px] leading-4 text-white/35">
            Scheduling unlocks only after the governed payment gate is satisfied. Final release remains
            gated by the required final payment and operational release controls.
          </p>
        </div>
      </div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/8 bg-white/[0.015] p-3">
      <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-white/30">{label}</div>
      <div className="mt-1 text-sm text-[#F6F1E6]">{value}</div>
    </div>
  );
}

function Amount({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-white/45">{label}</span>
      <span className={emphasis ? "font-mono text-sm text-[#C6A55A]" : "font-mono text-xs text-[#F6F1E6]"}>
        {value}
      </span>
    </div>
  );
}
