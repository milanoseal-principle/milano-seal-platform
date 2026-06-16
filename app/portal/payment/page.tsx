"use client";

export const dynamic = "force-dynamic";

import { usePortal } from "@/components/portal/portal-context";

const GOLD = "#C6A55A";
const GOLD_DIM = "rgba(198,165,90,0.55)";
const GOLD_BORDER = "rgba(198,165,90,0.18)";

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    paid: { label: "Payment Confirmed", color: "#4a9e6b", bg: "rgba(74,158,107,0.08)" },
    confirmed: { label: "Payment Confirmed", color: "#4a9e6b", bg: "rgba(74,158,107,0.08)" },
    payment_confirmed: { label: "Payment Confirmed", color: "#4a9e6b", bg: "rgba(74,158,107,0.08)" },
    pending: { label: "Payment Pending", color: GOLD, bg: "rgba(198,165,90,0.08)" },
    awaiting_payment: { label: "Payment Pending", color: GOLD, bg: "rgba(198,165,90,0.08)" },
    unpaid: { label: "Payment Pending", color: GOLD, bg: "rgba(198,165,90,0.08)" },
    failed: { label: "Payment Failed", color: "#e05c5c", bg: "rgba(224,92,92,0.08)" },
  };
  const s = map[status] ?? { label: "Payment Pending", color: GOLD, bg: "rgba(198,165,90,0.08)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 12px",
        borderRadius: 99,
        background: s.bg,
        border: `1px solid ${s.color}40`,
        fontSize: 11,
        fontFamily: "monospace",
        letterSpacing: "0.06em",
        color: s.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function ReleaseStatusPill({ isPaidAndReleased, matterStatus, paymentConfirmed }: {
  isPaidAndReleased: boolean;
  matterStatus: string | null | undefined;
  paymentConfirmed: boolean;
}) {
  if (isPaidAndReleased) {
    return (
      <span style={{ fontSize: 12, color: "#4a9e6b" }}>Paid &amp; Released</span>
    );
  }
  if (matterStatus === "shipped" || matterStatus === "delivered") {
    return <span style={{ fontSize: 12, color: GOLD }}>In Transit</span>;
  }
  if (matterStatus === "courier_ready") {
    return <span style={{ fontSize: 12, color: GOLD }}>Release pending final QA</span>;
  }
  if (matterStatus === "apostille_processing") {
    return <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Apostille processing</span>;
  }
  if (paymentConfirmed) {
    return <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Execution scheduled</span>;
  }
  return <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Release pending payment</span>;
}

export default function PaymentStatusPage() {
  const { deal, isLoading } = usePortal();

  if (isLoading) {
    return (
      <div style={{ paddingTop: 8 }} role="status" aria-label="Verifying payment state…">
        <div style={{ fontSize: 11, fontFamily: "monospace", color: GOLD_DIM, marginBottom: 16, letterSpacing: "0.1em" }}>
          Verifying payment state…
        </div>
        {[55, 36, 80].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 0 ? 28 : 52,
              borderRadius: 2,
              marginBottom: 12,
              background: "rgba(198,165,90,0.05)",
              border: "1px solid rgba(198,165,90,0.08)",
              animation: "ppSkeleton 2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
              width: `${w}%`,
            }}
          />
        ))}
      </div>
    );
  }

  if (!deal) {
    return (
      <div style={{ color: "rgba(255,255,255,.5)" }}>
        No matter linked to this account.
      </div>
    );
  }

  const paymentConfirmed =
    deal.payment_status === "paid" ||
    deal.payment_status === "confirmed" ||
    deal.payment_status === "payment_confirmed" ||
    deal.matter_status === "payment_confirmed";

  const wiseRef =
    deal.wise_reference ??
    `MS-${(deal.display_id ?? deal.id).slice(0, 8).toUpperCase()}`;

  const amountDue = deal.payment_amount_due ?? deal.amount_due ?? null;

  return (
    <div>
      {/* Header */}
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: GOLD_DIM,
          fontFamily: "monospace",
          marginBottom: 8,
        }}
      >
        Payment &amp; Invoice
      </div>
      <h1
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: 22,
          fontWeight: 600,
          color: "#E5E5E5",
          letterSpacing: "0.02em",
          marginBottom: 24,
        }}
      >
        Payment Status
      </h1>

      {/* Payment status card */}
      <div
        style={{
          background: "rgba(255,255,255,0.01)",
          border: `1px solid ${GOLD_BORDER}`,
          borderRadius: 8,
          padding: "24px 28px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: GOLD_DIM,
            fontFamily: "monospace",
            marginBottom: 18,
          }}
        >
          Payment Status
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <StatusPill status={deal.payment_status ?? (paymentConfirmed ? "paid" : "pending")} />
        </div>

        {/* KV rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {amountDue != null && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${GOLD_BORDER}`, paddingBottom: 10 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>Amount Due</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: paymentConfirmed ? "#4a9e6b" : GOLD }}>
                {paymentConfirmed ? "Paid in Full" : `$${Number(amountDue).toLocaleString()}`}
              </span>
            </div>
          )}

          {!paymentConfirmed && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${GOLD_BORDER}`, paddingBottom: 10 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>Wise Reference</span>
              <span style={{ fontSize: 12, fontFamily: "monospace", color: GOLD, letterSpacing: "0.06em" }}>{wiseRef}</span>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${GOLD_BORDER}`, paddingBottom: 10 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>Payment Confirmation</span>
            <span style={{ fontSize: 12, color: paymentConfirmed ? "#4a9e6b" : "rgba(255,255,255,0.35)" }}>
              {paymentConfirmed ? "Confirmed" : "Awaiting confirmation"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>Release Gate</span>
            <ReleaseStatusPill
              isPaidAndReleased={!!deal.is_paid_and_released}
              matterStatus={deal.matter_status}
              paymentConfirmed={paymentConfirmed}
            />
          </div>
        </div>
      </div>

      {/* Instruction card for pending payment */}
      {!paymentConfirmed && (
        <div
          style={{
            background: "rgba(198,165,90,0.03)",
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 8,
            padding: "20px 24px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: GOLD_DIM,
              fontFamily: "monospace",
              marginBottom: 12,
            }}
          >
            How to Pay
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, marginBottom: 10 }}>
            Payment is processed via Wise bank transfer. Include your Wise reference in the transfer memo so
            your payment can be matched to your matter automatically.
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
            Once confirmed, your scheduling will be unlocked and your coordinator will reach out with next steps.
            View your full invoice at{" "}
            <a
              href="/portal/invoice"
              style={{ color: GOLD, textDecoration: "none", borderBottom: `1px solid ${GOLD_BORDER}` }}
            >
              Invoice &amp; Payment Authorization
            </a>
            .
          </p>
        </div>
      )}

      {/* Paid & released state */}
      {deal.is_paid_and_released && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(74,158,107,0.06) 0%, rgba(198,165,90,0.06) 100%)",
            border: "1px solid rgba(198,165,90,0.3)",
            borderRadius: 8,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span style={{ color: "#4a9e6b", fontSize: 20, lineHeight: 1 }}>✓</span>
          <div>
            <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 600, fontSize: 14, color: GOLD, letterSpacing: "0.02em", marginBottom: 4 }}>
              PAID &amp; RELEASED
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
              Your documents have been released.{" "}
              <a href="/portal/documents" style={{ color: GOLD, textDecoration: "none" }}>
                View The Vault →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
