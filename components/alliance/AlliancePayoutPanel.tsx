import { Wallet } from "lucide-react";

type CommissionStatus = "NOT_ELIGIBLE" | "PENDING_REVIEW" | "APPROVED" | "PAID" | "ON_HOLD";

interface PayoutData {
  month_to_date: string;
  outstanding: string;
  year_to_date: string;
  next_payment: string;
  status: CommissionStatus;
}

interface AlliancePayoutPanelProps {
  data?: PayoutData;
}

const STATUS_CONFIG: Record<CommissionStatus, { label: string; color: string; bg: string; border: string }> = {
  NOT_ELIGIBLE: { label: "Not Eligible", color: "#A8A29A", bg: "rgba(168,162,154,0.06)", border: "rgba(168,162,154,0.2)" },
  PENDING_REVIEW: { label: "Pending Review", color: "#C99A3D", bg: "rgba(201,154,61,0.08)", border: "rgba(201,154,61,0.25)" },
  APPROVED: { label: "Approved", color: "#C6A55A", bg: "rgba(198,166,91,0.08)", border: "rgba(198,166,91,0.25)" },
  PAID: { label: "Paid", color: "#3FA47A", bg: "rgba(63,164,122,0.08)", border: "rgba(63,164,122,0.25)" },
  ON_HOLD: { label: "On Hold", color: "#C99A3D", bg: "rgba(201,154,61,0.06)", border: "rgba(201,154,61,0.2)" },
};

const DEFAULT_DATA: PayoutData = {
  month_to_date: "—",
  outstanding: "—",
  year_to_date: "—",
  next_payment: "—",
  status: "NOT_ELIGIBLE",
};

export function AlliancePayoutPanel({ data = DEFAULT_DATA }: AlliancePayoutPanelProps) {
  const statusCfg = STATUS_CONFIG[data.status];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Status badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 16px",
          background: statusCfg.bg,
          border: `1px solid ${statusCfg.border}`,
          borderRadius: 6,
          alignSelf: "flex-start",
        }}
      >
        <Wallet size={14} color={statusCfg.color} />
        <span
          style={{
            fontSize: 12,
            fontFamily: "monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: statusCfg.color,
            fontWeight: 600,
          }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
        }}
      >
        {[
          { label: "Month to Date", value: data.month_to_date },
          { label: "Outstanding", value: data.outstanding },
          { label: "Year to Date", value: data.year_to_date },
          { label: "Next Payment", value: data.next_payment },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "16px",
              background: "#111111",
              border: "1px solid rgba(198,166,91,0.12)",
              borderRadius: 6,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#A8A29A",
                marginBottom: 8,
              }}
            >
              {item.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: "#F6F1E6" }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: "#A8A29A", margin: 0, lineHeight: 1.6 }}>
        Commission eligibility is determined by routing status and matter completion. Payouts are processed manually by the Milano Seal team. No automatic payout formulas are visible to partners.
      </p>
    </div>
  );
}
