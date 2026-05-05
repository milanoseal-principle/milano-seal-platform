"use client";
import { ModuleWrapper, DataCard } from "./_module-wrapper";

const SUMMARY = `Revenue, retainer, balance and net per deal — pulled live from Supabase.`;
const DETAIL = `Quoted = total invoice. Paid = retainer received + balance received. Balance = outstanding amount on shipped/in-flight deals. Net = paid – refunds.`;

interface FinancialsDeal {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  execution_tier: string | null;
  base_price: number | null;
  requires_apostille: boolean | null;
  urgency: string | null;
  amount: number | null;
  invoice_subtotal: number | null;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  payment_status: string | null;
  payment_amount_received: number | null;
  balance_payment_status: string | null;
  balance_amount_received: number | null;
  refund_amount: number | null;
  status: string | null;
  created_at: string | null;
}

function fmt(n: number | null | undefined) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v === 0) return "$0";
  return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function paidTotal(d: FinancialsDeal): number {
  const retainer = Number(d.payment_amount_received ?? 0);
  const balance = Number(d.balance_amount_received ?? 0);
  return retainer + balance;
}

function netTotal(d: FinancialsDeal): number {
  const paid = paidTotal(d);
  const refunded = Number(d.refund_amount ?? 0);
  return paid - refunded;
}

function balanceOutstanding(d: FinancialsDeal): number {
  const invoiceBalance = Number(d.invoice_balance ?? 0);
  const balanceReceived = Number(d.balance_amount_received ?? 0);
  return Math.max(0, invoiceBalance - balanceReceived);
}

export function FinancialsModule({ mod, data }: any) {
  const deals: FinancialsDeal[] = data?.deals ?? [];

  const totalQuoted = deals.reduce((s, d) => s + Number(d.amount ?? 0), 0);
  const totalPaid = deals.reduce((s, d) => s + paidTotal(d), 0);
  const totalBalance = deals.reduce((s, d) => s + balanceOutstanding(d), 0);
  const totalNet = deals.reduce((s, d) => s + netTotal(d), 0);

  return (
    <ModuleWrapper mod={mod}>
      <div className="bg-[#111111] border border-[#C6A55A]/15 rounded-xl p-5 mb-6">
        <p className="text-[#C6A55A] text-xs font-semibold tracking-widest uppercase mb-2">
          Module Summary
        </p>
        <p className="text-[#B0B0B0] text-sm leading-relaxed whitespace-pre-line">
          {SUMMARY}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <DataCard title="Quoted" value={fmt(totalQuoted)} sub="All deals" />
        <DataCard
          title="Paid"
          value={fmt(totalPaid)}
          sub="Retainer + balance"
          gold
        />
        <DataCard
          title="Outstanding"
          value={fmt(totalBalance)}
          sub="Balance owed"
        />
        <DataCard title="Net" value={fmt(totalNet)} sub="After refunds" />
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  "Deal ID",
                  "Client",
                  "Lane",
                  "Base",
                  "Apostille",
                  "Urgency",
                  "Quoted",
                  "Paid",
                  "Balance",
                  "Net",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-[#8A8A8A] border-b border-[#2A2A2A] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-[#8A8A8A] text-sm italic"
                  >
                    No deals to report yet. Once intake captures matters, they
                    appear here.
                  </td>
                </tr>
              ) : (
                deals.map((d) => {
                  const paid = paidTotal(d);
                  const balance = balanceOutstanding(d);
                  const net = netTotal(d);
                  const flagged =
                    d.payment_status === "refunded" ||
                    d.payment_status === "disputed" ||
                    d.payment_status === "failed";
                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-[#1A1A1A] transition-colors ${
                        flagged ? "bg-red-500/[0.04]" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-[#C6A55A] text-xs font-mono">
                        {d.deal_id ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-white text-sm font-medium">
                        {d.client_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#8A8A8A] text-sm capitalize">
                        {d.execution_tier ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#B0B0B0] text-sm">
                        {fmt(d.base_price)}
                      </td>
                      <td className="px-4 py-3 text-[#B0B0B0] text-sm">
                        {d.requires_apostille ? "Yes" : "—"}
                      </td>
                      <td className="px-4 py-3 text-[#B0B0B0] text-sm capitalize">
                        {d.urgency ?? "standard"}
                      </td>
                      <td className="px-4 py-3 text-white text-sm">
                        {fmt(d.amount ?? d.invoice_subtotal)}
                      </td>
                      <td className="px-4 py-3 text-[#C6A55A] text-sm">
                        {fmt(paid)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${
                          balance > 0 ? "text-amber-400" : "text-[#8A8A8A]"
                        }`}
                      >
                        {balance > 0 ? fmt(balance) : "—"}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm ${
                          net < 0
                            ? "text-red-400"
                            : net === 0
                              ? "text-[#8A8A8A]"
                              : "text-emerald-400"
                        }`}
                      >
                        {fmt(net)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl p-5">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase font-semibold mb-3">
          How this is computed
        </p>
        <p className="text-[#8A8A8A] text-xs leading-relaxed whitespace-pre-line font-mono">
          {DETAIL}
        </p>
      </div>
    </ModuleWrapper>
  );
}
