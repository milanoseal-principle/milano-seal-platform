"use client";

// Staged — operator only. No automation. No partner visibility.
// Payout review is manual, requires PAID_AND_RELEASED and operator confirmation.

interface PayoutReviewItem {
  id: string;
  matter_id: string;
  partner_id: string | null;
  review_status: "not_eligible" | "pending_review" | "approved" | "rejected" | "paid";
  eligibility_note: string | null;
  created_at: string;
}

const STATUS_COLORS = {
  not_eligible: "#6b7280",
  pending_review: "#f59e0b",
  approved: "#4a9e6b",
  rejected: "#ef4444",
  paid: "#C6A55A",
};

export function PayoutReviewPanel({ items }: { items: PayoutReviewItem[] }) {
  const pending = items.filter(i => i.review_status === "pending_review");

  return (
    <div style={{ fontFamily: "var(--font-geist-mono, monospace)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ color: "#C6A55A", fontSize: 11, letterSpacing: "0.08em" }}>PAYOUT REVIEW</span>
        <span style={{ color: "#374151", fontSize: 10 }}>Operator-confirmed only · No automation</span>
        {pending.length > 0 && (
          <span style={{
            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 4, color: "#f59e0b", fontSize: 10, padding: "1px 8px",
          }}>
            {pending.length} pending
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p style={{ color: "#374151", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
          No payout reviews. Reviews are created only after a matter reaches PAID_AND_RELEASED.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${STATUS_COLORS[item.review_status]}22`,
              borderLeft: `3px solid ${STATUS_COLORS[item.review_status]}`,
              borderRadius: 6, padding: "10px 14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace" }}>
                  {item.matter_id.substring(0, 8)}
                </span>
                <span style={{ color: STATUS_COLORS[item.review_status], fontSize: 10, letterSpacing: "0.06em" }}>
                  {item.review_status.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              {item.eligibility_note && (
                <p style={{ color: "#6b7280", fontSize: 11, margin: "6px 0 0" }}>{item.eligibility_note}</p>
              )}
            </div>
          ))}
        </div>
      )}

      <p style={{ color: "#374151", fontSize: 10, marginTop: 16, lineHeight: 1.6 }}>
        No payout is processed without: paid matter, completed release, locked attribution, operator review, and manual confirmation.
        This panel is operator-only and is never exposed to partners, VA, or portal.
      </p>
    </div>
  );
}
