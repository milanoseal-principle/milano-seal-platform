"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SecurePaymentCard } from "@/components/payments/SecurePaymentCard";
import { useApi } from "@/hooks/useApi";

interface MatterPaymentTruth {
  id: string;
  deal_id: string;
  client_name: string;
  document_type: string;
  destination_country: string;
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

export default function ProFormaPaymentReviewPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { data: deal, isLoading, refetch } = useApi<MatterPaymentTruth>(id ? `/api/deals/${id}` : null);

  if (isLoading) {
    return <div className="py-10 text-xs font-mono uppercase tracking-[0.18em] text-[#C6A55A]/60">Loading Pro Forma…</div>;
  }

  if (!deal) {
    return <div className="py-10 text-sm text-white/50">Matter not found.</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <Link href={`/dashboard/deals/${deal.id}`} className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-[#C6A55A]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Matter
      </Link>

      <header className="rounded-2xl border border-[#C6A55A]/15 bg-white/[0.015] p-6">
        <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-[#C6A55A]/65">Pro Forma Review</div>
        <h1 className="mt-2 font-serif text-3xl text-[#F6F1E6]">{deal.client_name}</h1>
        <p className="mt-2 text-sm leading-6 text-white/45">
          {deal.document_type} → {deal.destination_country}. This review reflects the current canonical Matter pricing. Any partner or courtesy code is validated by the server before Wise payment instructions are refreshed.
        </p>
      </header>

      <SecurePaymentCard deal={deal} onRefresh={() => void refetch()} />

      <p className="text-center text-[10px] uppercase tracking-[0.14em] text-white/30">
        Wise secure payment · Scheduling remains locked until verified reconciliation
      </p>
    </div>
  );
}
