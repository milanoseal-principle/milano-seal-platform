"use client";

export const dynamic = "force-dynamic";

import { SecurePaymentCard } from "@/components/payments/SecurePaymentCard";
import { usePortal } from "@/components/portal/portal-context";

export default function PaymentStatusPage() {
  const { deal, isLoading, refresh } = usePortal();

  if (isLoading) {
    return (
      <div className="py-8 text-[11px] font-mono uppercase tracking-[0.16em] text-[#C6A55A]/65" role="status">
        Verifying payment state…
      </div>
    );
  }

  if (!deal) {
    return <div className="py-8 text-sm text-white/50">No Matter is linked to this account.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <header className="space-y-2">
        <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-[#C6A55A]/60">Payment &amp; Authorization</div>
        <h1 className="font-serif text-3xl text-[#F6F1E6]">Secure Payment</h1>
        <p className="max-w-2xl text-sm leading-6 text-white/45">
          Your payment is generated from the canonical Matter record. Partner or courtesy codes are validated by the server before Wise instructions are refreshed. Scheduling remains locked until verified Wise reconciliation.
        </p>
      </header>

      <SecurePaymentCard
        deal={{
          id: deal.id,
          deal_id: deal.display_id ?? deal.matter_id,
          lane: deal.assigned_lane ?? "Execution",
          total_price: Number(deal.final_total ?? deal.original_total ?? 0),
          original_total: deal.original_total,
          discount_code: deal.discount_code,
          discount_amount: deal.discount_amount,
          final_total: deal.final_total,
          invoice_retainer: deal.invoice_retainer,
          invoice_balance: deal.invoice_balance,
          amount_due: deal.amount_due ?? deal.payment_amount_due,
          amount_paid: deal.amount_paid,
          payment_status: deal.payment_status ?? (deal.payment_confirmed ? "paid" : "unpaid"),
          payment_link: deal.wise_payment_url,
          payment_disposition: deal.payment_disposition,
        }}
        onRefresh={() => void refresh()}
      />
    </div>
  );
}
