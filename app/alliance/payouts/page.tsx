import { DollarSign, Calendar } from "lucide-react";

export default function AlliancePayoutsPage() {
  return (
    <div className="space-y-6">
      <div className="ap-card ap-card-body">
        <div className="ap-eyebrow">Financial Ledger</div>
        <h1
          className="text-2xl font-semibold text-gray-900 mt-1"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Commission & Payouts
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track earned commissions, payout schedule, and payment history.
        </p>
      </div>

      {/* Payout stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Month to Date", value: "$0.00", sub: "Cleared commissions" },
          { label: "Outstanding", value: "$0.00", sub: "Pending completion" },
          { label: "Year to Date", value: "$0.00", sub: "All cleared payouts" },
        ].map((s) => (
          <div key={s.label} className="ap-card">
            <div className="ap-payout-stat">
              <div className="ap-payout-stat-amount">{s.value}</div>
              <div className="ap-payout-stat-label">{s.label}</div>
              <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Next payment */}
      <div className="ap-card ap-card-body flex items-center gap-4">
        <div className="ap-action-icon">
          <Calendar size={18} color="#d4af37" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">
            Next Scheduled Payout
          </div>
          <div className="text-sm text-gray-500">
            Payouts processed Net 30 after matter completion — no active
            payouts scheduled.
          </div>
        </div>
      </div>

      {/* Transaction history placeholder */}
      <div className="ap-card">
        <div className="ap-card-header">
          <h3 className="ap-card-title">Transaction History</h3>
        </div>
        <div className="ap-empty">
          <DollarSign size={32} className="mx-auto mb-3 text-gray-200" />
          <div className="font-medium text-gray-500">No transactions yet</div>
          <div className="text-gray-400 text-sm mt-1">
            Commission payments will appear here after matters are completed and
            reviewed.
          </div>
        </div>
      </div>

      {/* Commission structure */}
      <div className="ap-card">
        <div className="ap-card-header">
          <h3 className="ap-card-title">Commission Structure</h3>
        </div>
        <div className="ap-card-body space-y-0">
          <div className="ap-kv">
            <span className="ap-kv-k">Standard Jobs</span>
            <span className="ap-kv-v font-mono">Net payout per job</span>
          </div>
          <div className="ap-kv">
            <span className="ap-kv-k">Payment Method</span>
            <span className="ap-kv-v">Wise / ACH</span>
          </div>
          <div className="ap-kv">
            <span className="ap-kv-k">Payment Terms</span>
            <span className="ap-kv-v">Net 30 after completion review</span>
          </div>
          <div className="ap-kv">
            <span className="ap-kv-k">Statements</span>
            <span className="ap-kv-v">Monthly via secure portal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
