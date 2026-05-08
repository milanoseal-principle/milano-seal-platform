"use client";

import { useEffect, useState, useCallback } from "react";
import { STATUS_LABEL, type PaymentStatus } from "@/lib/payments/state-machine";
import { createClient } from "@/lib/supabase/client";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface PaymentRow {
  id: string;
  matter_id: string;
  wise_reference: string;
  payment_type: string;
  payment_amount: number;
  payment_currency: string;
  payment_status: PaymentStatus;
  payment_confirmed: boolean;
  payer_name: string | null;
  paid_at: string | null;
  created_at: string;
}

export function OperatorPaymentBadge({ matterId }: { matterId: string }) {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchPayments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("matter_id", matterId)
      .order("created_at", { ascending: false });
    setPayments((data ?? []) as PaymentRow[]);
    setLoaded(true);
  }, [matterId]);

  useEffect(() => {
    void fetchPayments();
    const supabase = createClient();
    const channel = supabase
      .channel(`operator-payments-${matterId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `matter_id=eq.${matterId}`,
        },
        () => void fetchPayments(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [matterId, fetchPayments]);

  const totalDue = payments.reduce(
    (sum, p) => sum + Number(p.payment_amount || 0),
    0,
  );
  const totalPaid = payments
    .filter((p) => p.payment_confirmed)
    .reduce((sum, p) => sum + Number(p.payment_amount || 0), 0);
  const balance = totalDue - totalPaid;

  return (
    <div className="bg-[#0f0f13] border border-[#D4AF37]/15 rounded-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-mono text-gray-500 tracking-[0.3em] uppercase">
          Payment Ledger
        </span>
        <span className="text-[9px] font-mono text-emerald-400 tracking-wider">
          {payments.length} {payments.length === 1 ? "ENTRY" : "ENTRIES"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <LedgerCell label="Due" value={`$${totalDue.toFixed(2)}`} />
        <LedgerCell
          label="Paid"
          value={`$${totalPaid.toFixed(2)}`}
          tone="emerald"
        />
        <LedgerCell
          label="Balance"
          value={`$${balance.toFixed(2)}`}
          tone={balance > 0 ? "gold" : "emerald"}
        />
      </div>

      {!loaded ? (
        <div className="text-[10.5px] text-gray-500 font-mono py-3 text-center">
          Loading…
        </div>
      ) : payments.length === 0 ? (
        <div className="text-[10.5px] text-gray-500 font-mono py-3 text-center">
          No payments recorded yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-sm border border-[#D4AF37]/5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CompactStatusBadge status={p.payment_status} />
                <div className="min-w-0">
                  <div className="text-xs text-white font-mono truncate">
                    {p.wise_reference}
                  </div>
                  <div className="text-[9px] text-gray-500 capitalize">
                    {p.payment_type.replace(/_/g, " ")}
                  </div>
                </div>
              </div>
              <div className="text-sm font-mono text-white font-semibold ml-3 flex-shrink-0">
                ${Number(p.payment_amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LedgerCell({
  label,
  value,
  tone = "gold",
}: {
  label: string;
  value: string;
  tone?: "gold" | "emerald";
}) {
  const color = tone === "emerald" ? "text-emerald-400" : "text-[#D4AF37]";
  return (
    <div className="bg-black/40 border border-[#D4AF37]/10 rounded-sm p-2.5">
      <div className="text-[8px] text-gray-500 uppercase tracking-[0.3em] mb-1">
        {label}
      </div>
      <div className={`text-sm font-mono font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function CompactStatusBadge({ status }: { status: PaymentStatus }) {
  const config: Record<
    PaymentStatus,
    { color: string; bg: string; border: string; Icon: typeof Clock }
  > = {
    awaiting_payment: {
      color: "text-[#D4AF37]",
      bg: "bg-[#D4AF37]/10",
      border: "border-[#D4AF37]/30",
      Icon: Clock,
    },
    payment_pending: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      Icon: Clock,
    },
    payment_confirmed: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      Icon: CheckCircle2,
    },
    payment_failed: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      Icon: AlertCircle,
    },
    partially_paid: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      Icon: Clock,
    },
    refunded: {
      color: "text-gray-400",
      bg: "bg-gray-500/10",
      border: "border-gray-500/30",
      Icon: AlertCircle,
    },
  };
  const c = config[status];
  const { Icon } = c;
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 ${c.bg} ${c.border} border rounded-sm flex-shrink-0`}
    >
      <Icon className={`w-2.5 h-2.5 ${c.color}`} />
      <span
        className={`text-[9px] font-mono font-semibold ${c.color} tracking-[0.15em]`}
      >
        {STATUS_LABEL[status]}
      </span>
    </div>
  );
}
