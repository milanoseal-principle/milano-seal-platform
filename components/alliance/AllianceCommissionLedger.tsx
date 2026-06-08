"use client";

import { DollarSign } from "lucide-react";

type CommissionStatus =
  | "NOT_ELIGIBLE"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "ON_HOLD"
  | "NEEDS_REVIEW";

type Commission = {
  id: string;
  matter_ref?: string;
  amount?: number;
  status: CommissionStatus;
  period?: string;
  notes?: string;
};

type Summary = {
  month_to_date?: number;
  year_to_date?: number;
  outstanding?: number;
};

type Props = {
  commissions: Commission[];
  summary?: Summary;
};

const STATUS_CONFIG: Record<
  CommissionStatus,
  { label: string; bg: string; color: string; border: string }
> = {
  APPROVED: {
    label: "Approved",
    bg: "rgba(198,165,90,0.1)",
    color: "#C6A55A",
    border: "rgba(198,165,90,0.25)",
  },
  PAID: {
    label: "Paid",
    bg: "rgba(63,164,122,0.1)",
    color: "#3FA47A",
    border: "rgba(63,164,122,0.25)",
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    bg: "rgba(212,175,55,0.08)",
    color: "#C6A55A",
    border: "rgba(198,165,90,0.2)",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    bg: "rgba(212,175,55,0.06)",
    color: "rgba(198,165,90,0.75)",
    border: "rgba(198,165,90,0.15)",
  },
  REJECTED: {
    label: "Rejected",
    bg: "rgba(180,50,50,0.08)",
    color: "rgba(255,100,100,0.7)",
    border: "rgba(180,50,50,0.2)",
  },
  ON_HOLD: {
    label: "On Hold",
    bg: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.1)",
  },
  NOT_ELIGIBLE: {
    label: "Not Eligible",
    bg: "rgba(255,255,255,0.02)",
    color: "rgba(255,255,255,0.2)",
    border: "rgba(255,255,255,0.05)",
  },
};

function fmt(val?: number): string {
  if (val == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
}

export function AllianceCommissionLedger({ commissions, summary }: Props) {
  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Month to Date", value: summary?.month_to_date },
          { label: "Year to Date", value: summary?.year_to_date },
          { label: "Outstanding", value: summary?.outstanding },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-sm p-4"
            style={{
              background: "rgba(8,5,1,0.96)",
              border: "1px solid rgba(198,165,90,0.1)",
            }}
          >
            <p
              className="text-[9px] font-mono uppercase tracking-[0.2em]"
              style={{ color: "rgba(198,165,90,0.45)" }}
            >
              {s.label}
            </p>
            <p
              className="text-lg font-mono mt-1"
              style={{ color: "rgba(246,241,230,0.75)" }}
            >
              {s.value != null ? fmt(s.value) : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-sm"
        style={{
          background: "rgba(8,5,1,0.96)",
          border: "1px solid rgba(198,165,90,0.1)",
        }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "rgba(198,165,90,0.08)" }}
        >
          <h2
            className="text-sm font-light"
            style={{
              fontFamily: "var(--font-playfair),Georgia,serif",
              color: "rgba(246,241,230,0.85)",
            }}
          >
            Commission Records
          </h2>
          <p
            className="text-[10px] mt-0.5"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Payout amounts reviewed by operator before any approval. Amounts shown only for approved/paid records.
          </p>
        </div>

        {commissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <DollarSign size={28} style={{ color: "rgba(198,165,90,0.15)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No commission records yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(198,165,90,0.08)" }}>
                  {["Matter Ref", "Period", "Status", "Amount"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[9px] font-mono uppercase tracking-[0.15em]"
                      style={{ color: "rgba(198,165,90,0.4)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => {
                  const cfg = STATUS_CONFIG[c.status];
                  const showAmount =
                    c.status !== "NOT_ELIGIBLE" && c.amount != null;

                  return (
                    <tr
                      key={c.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    >
                      <td
                        className="px-5 py-3 font-mono text-[10px]"
                        style={{ color: "rgba(198,165,90,0.6)" }}
                      >
                        {c.matter_ref ?? "—"}
                      </td>
                      <td
                        className="px-5 py-3 font-mono text-[10px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {c.period ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[9px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm"
                          style={{
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3 font-mono text-[10px]"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {showAmount ? fmt(c.amount) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div
          className="px-5 py-3 border-t"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}
        >
          <p
            className="text-[9px] font-mono"
            style={{ color: "rgba(255,255,255,0.15)" }}
          >
            Revenue, margins, and internal payment details are not accessible through this portal.
          </p>
        </div>
      </div>
    </div>
  );
}
