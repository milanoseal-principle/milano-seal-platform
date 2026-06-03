"use client";

import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

interface WiseItem {
  deal_id: string | null;
  client_name: string | null;
  email: string | null;
  total_price: number | null;
  db_payment_status: string | null;
  payment_method: string | null;
  created_at: string | null;
  wise: {
    id: string;
    status: string;
    short_url: string | null;
    amount: number | null;
    currency: string | null;
    description: string | null;
    payer_name: string | null;
    payer_email: string | null;
    created_at: string | null;
  } | null;
}

interface WiseResponse {
  ok: boolean;
  wise_ok?: boolean;
  wise_error?: string;
  fetched_at: string;
  wise_total: number;
  items: WiseItem[];
}

interface SummaryResponse {
  confirmed_payments: number;
  pending_payments: number;
  failed_payments: number;
  balance_due: number;
}

export default function FinanceReconciliation() {
  const { data: wiseData, isLoading: wiseLoading } =
    useApi<WiseResponse>("/api/admin/wise/payments");
  const { data: summary, isLoading: summaryLoading } =
    useApi<SummaryResponse>("/api/dashboard/summary");

  const wiseItems = wiseData?.items ?? [];
  const wisePayments = wiseItems.filter((i) => i.wise !== null);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-2">
          Finance Reconciliation
        </p>
        <h1 className="font-serif text-4xl text-foreground">Payment Ledger</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Live reconciliation of Wise transfers and internal payment records.
        </p>
      </div>

      {/* Payment Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Confirmed"
          value={summary?.confirmed_payments ?? 0}
          tone="paid"
          loading={summaryLoading}
        />
        <SummaryCard
          label="Pending"
          value={summary?.pending_payments ?? 0}
          tone="await"
          loading={summaryLoading}
        />
        <SummaryCard
          label="Failed"
          value={summary?.failed_payments ?? 0}
          tone="critical"
          loading={summaryLoading}
        />
      </div>

      {/* Balance Due */}
      <Card className="bg-[#0c0c12] border border-gray-900 rounded-sm">
        <CardHeader className="pb-2 p-4">
          <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">
            Balance Due
          </p>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {summaryLoading ? (
            <div className="h-10 w-32 bg-white/[0.03] rounded animate-pulse" />
          ) : (
            <p className="font-serif text-3xl text-[#D4AF37]">
              {formatCurrency(summary?.balance_due ?? 0)}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Sum of open unpaid matters
          </p>
        </CardContent>
      </Card>

      {/* Wise Transfers */}
      <Card className="bg-[#0c0c12] border border-gray-900 rounded-sm">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1">
                Wise Transfers
              </p>
              <h2 className="font-serif text-lg text-foreground">
                Payment Requests
              </h2>
            </div>
            {wiseData && (
              <span className="text-[10px] text-muted-foreground font-mono">
                {wiseData.wise_total} live · fetched{" "}
                {new Date(wiseData.fetched_at).toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {wiseLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 w-full bg-white/[0.02] rounded animate-pulse"
                />
              ))}
            </div>
          ) : wiseData?.wise_ok === false ? (
            <div className="p-6 text-center space-y-1">
              <div className="text-sm font-mono text-yellow-400 uppercase tracking-widest">Wise Unavailable</div>
              <div className="text-xs text-muted-foreground">Reconciliation pending — do not treat open matters as confirmed.</div>
              {wiseData?.wise_error && (
                <div className="text-[10px] text-red-400 mt-2">{wiseData.wise_error}</div>
              )}
            </div>
          ) : wisePayments.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No Wise payment records found. Reconciliation pending.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-900">
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Matter
                    </th>
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Client
                    </th>
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Amount
                    </th>
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Status
                    </th>
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wisePayments.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-900/50 hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-mono text-xs text-[#D4AF37]">
                          {item.deal_id ?? "—"}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-foreground">
                        {item.client_name ?? item.wise?.payer_name ?? "—"}
                      </td>
                      <td className="p-3 font-mono text-sm text-foreground">
                        {item.wise?.amount != null
                          ? `${item.wise.currency ?? "USD"} ${Number(item.wise.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                          : item.total_price != null
                            ? formatCurrency(item.total_price)
                            : "—"}
                      </td>
                      <td className="p-3">
                        <WiseStatusBadge status={item.wise?.status ?? item.db_payment_status ?? "—"} />
                      </td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">
                        {item.wise?.created_at
                          ? new Date(item.wise.created_at).toLocaleDateString()
                          : item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All deals payment overview */}
      {!wiseLoading && wiseItems.length > wisePayments.length && (
        <Card className="bg-[#0c0c12] border border-gray-900 rounded-sm">
          <CardHeader className="p-4 pb-2">
            <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1">
              Other Payment Methods
            </p>
            <h2 className="font-serif text-lg text-foreground">
              Non-Wise Transactions
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-900">
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Matter
                    </th>
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Client
                    </th>
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Method
                    </th>
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Total
                    </th>
                    <th className="text-left p-3 text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wiseItems
                    .filter((i) => i.wise === null)
                    .map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-900/50 hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="p-3">
                          <span className="font-mono text-xs text-[#D4AF37]">
                            {item.deal_id ?? "—"}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-foreground">
                          {item.client_name ?? "—"}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground uppercase tracking-wider">
                          {item.payment_method ?? "—"}
                        </td>
                        <td className="p-3 font-mono text-sm text-foreground">
                          {item.total_price != null
                            ? formatCurrency(item.total_price)
                            : "—"}
                        </td>
                        <td className="p-3">
                          <WiseStatusBadge
                            status={item.db_payment_status ?? "unknown"}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: number;
  tone: "paid" | "await" | "critical";
  loading: boolean;
}) {
  const cls =
    tone === "paid"
      ? "text-[#5dbb8a]"
      : tone === "critical"
        ? "text-[#e07070]"
        : "text-[#c6a55a]";

  return (
    <Card className="bg-[#0c0c12] border border-gray-900 rounded-sm">
      <CardContent className="p-4">
        <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-2">
          {label}
        </p>
        {loading ? (
          <div className="h-8 w-16 bg-white/[0.03] rounded animate-pulse" />
        ) : (
          <p className={`font-serif text-3xl ${cls}`}>{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">payments</p>
      </CardContent>
    </Card>
  );
}

function WiseStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  // Only DB-confirmed "paid" shows green. Wise-side statuses are informational only.
  // "incoming_payment_waiting" = Wise is waiting for transfer — NOT confirmed.
  // "completed" from Wise = transfer processed on Wise side — still needs operator reconciliation.
  const isPaid = s === "paid";
  const isWiseComplete = s === "completed";
  const isWisePending = s === "incoming_payment_waiting";
  const isFailed = s === "failed" || s === "cancelled" || s === "returned";

  const label = isWisePending
    ? "Wise Pending"
    : isWiseComplete
    ? "Wise Complete — Reconcile"
    : status;

  return (
    <Badge
      variant="outline"
      className={
        isPaid
          ? "bg-paid"
          : isFailed
          ? "bg-critical"
          : isWiseComplete
          ? "border-yellow-600 text-yellow-400 bg-yellow-950/30"
          : "bg-await"
      }
    >
      {label}
    </Badge>
  );
}
