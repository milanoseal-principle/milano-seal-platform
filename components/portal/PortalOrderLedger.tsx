"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePortal } from "@/components/portal/portal-context";

interface InvoiceLineItem {
  key: string;
  label: string;
  amount: number;
  kind: string;
  discountable: boolean;
}

interface InvoiceSnapshot {
  currency: string;
  lineItems: InvoiceLineItem[];
  originalTotal: number;
  discountAmount: number;
  discountPercent: number | null;
  finalTotal: number;
  retainer: number;
  balance: number;
  amountDueNow: number;
  paymentConfirmed: boolean;
}

function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function PortalOrderLedger() {
  const pathname = usePathname();
  const { deal } = usePortal();
  const [invoice, setInvoice] = useState<InvoiceSnapshot | null>(null);

  useEffect(() => {
    if (pathname !== "/portal" || !deal?.id) return;
    let alive = true;
    fetch(`/api/portal/me/invoice?deal_id=${encodeURIComponent(deal.id)}`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ invoice: InvoiceSnapshot }> : null)
      .then((body) => { if (alive) setInvoice(body?.invoice ?? null); })
      .catch(() => { if (alive) setInvoice(null); });
    return () => { alive = false; };
  }, [deal?.id, pathname, deal?.discount_amount, deal?.amount_due]);

  if (pathname !== "/portal" || !deal || !invoice) return null;

  return (
    <section
      data-portal-order-ledger=""
      className="mb-6 overflow-hidden rounded-xl border border-[#C6A55A]/25 bg-[linear-gradient(145deg,rgba(198,165,90,.08),rgba(255,255,255,.012)_34%,rgba(0,0,0,.16))] shadow-[0_22px_70px_rgba(0,0,0,.32)]"
    >
      <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C6A55A]/70">Matter Order Ledger</div>
          <h2 className="mt-2 font-serif text-xl text-white">Your approved scope and payment position</h2>
          <p className="mt-1 text-xs leading-5 text-white/42">Every client-facing charge is itemized before Wise payment. Discounts recalculate the final total and 50% retainer before payment.</p>
        </div>
        <Link
          href="/portal/invoice"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-[#C6A55A]/35 px-4 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#C6A55A] transition hover:bg-[#C6A55A]/10"
        >
          Review invoice & payment →
        </Link>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
        <div className="px-5 py-4 sm:px-6">
          {invoice.lineItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-5 border-b border-white/[0.055] py-3 last:border-b-0">
              <div>
                <div className="text-sm text-white/78">{item.label}</div>
                <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-white/28">
                  {item.discountable ? "Service charge" : "Pass-through / delivery"}
                </div>
              </div>
              <div className="font-mono text-sm text-[#E6D39B]">{money(item.amount, invoice.currency)}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] bg-black/20 px-5 py-5 lg:border-l lg:border-t-0 sm:px-6">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between gap-4 text-white/45"><span>Original total</span><strong className="font-mono font-medium text-white/75">{money(invoice.originalTotal, invoice.currency)}</strong></div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between gap-4 text-emerald-300/75"><span>Discount{invoice.discountPercent ? ` · ${invoice.discountPercent}%` : ""}</span><strong className="font-mono font-medium">−{money(invoice.discountAmount, invoice.currency)}</strong></div>
            )}
            <div className="h-px bg-white/[0.07]" />
            <div className="flex justify-between gap-4 text-white/55"><span>Final Matter total</span><strong className="font-mono text-base font-medium text-[#C6A55A]">{money(invoice.finalTotal, invoice.currency)}</strong></div>
            <div className="flex justify-between gap-4 text-white/45"><span>50% retainer</span><strong className="font-mono font-medium text-white/75">{money(invoice.retainer, invoice.currency)}</strong></div>
            <div className="flex justify-between gap-4 text-white/45"><span>Remaining balance</span><strong className="font-mono font-medium text-white/75">{money(invoice.balance, invoice.currency)}</strong></div>
          </div>
          <div className="mt-5 rounded-md border border-[#C6A55A]/24 bg-[#C6A55A]/[0.055] px-4 py-4">
            <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#C6A55A]/65">{invoice.paymentConfirmed ? "Payment verified" : "Due before scheduling"}</div>
            <div className="mt-1 font-serif text-2xl text-white">{money(invoice.amountDueNow, invoice.currency)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
