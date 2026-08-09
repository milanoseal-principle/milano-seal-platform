"use client";

export const dynamic = "force-dynamic";

import { usePortal } from "@/components/portal/portal-context";

const GOLD = "#C6A55A";
const GOLD_DIM = "rgba(198,165,90,0.55)";
const GOLD_BORDER = "rgba(198,165,90,0.18)";
const GREEN = "#4a9e6b";

function money(value: number | null | undefined, currency = "USD") {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function StatusPill({ confirmed }: { confirmed: boolean }) {
  const color = confirmed ? GREEN : GOLD;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 99,
        background: confirmed
          ? "rgba(74,158,107,0.08)"
          : "rgba(198,165,90,0.08)",
        border: `1px solid ${color}40`,
        fontSize: 11,
        fontFamily: "monospace",
        letterSpacing: "0.06em",
        color,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {confirmed ? "Payment Verified" : "Awaiting Payment"}
    </span>
  );
}

function Row({
  label,
  value,
  emphasis,
  positive,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        padding: "11px 0",
        borderBottom: `1px solid ${GOLD_BORDER}`,
      }}
    >
      <span
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: emphasis ? 15 : 13,
          fontWeight: emphasis ? 600 : 500,
          color: positive ? GREEN : emphasis ? GOLD : "#E5E5E5",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function PaymentStatusPage() {
  const { deal, isLoading } = usePortal();

  if (isLoading) {
    return (
      <div style={{ paddingTop: 8 }} role="status">
        <div
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            color: GOLD_DIM,
            marginBottom: 16,
            letterSpacing: "0.1em",
          }}
        >
          Verifying payment state…
        </div>
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
    deal.payment_confirmed ||
    deal.payment_status === "paid" ||
    deal.payment_status === "confirmed" ||
    deal.payment_status === "payment_confirmed";

  const currency = deal.currency ?? "USD";
  const amountDue = deal.amount_due ?? deal.payment_amount_due ?? null;
  const originalTotal = deal.original_total;
  const discountAmount = deal.discount_amount ?? 0;
  const finalTotal = deal.final_total;
  const courtesyApplied = deal.courtesy_applied && discountAmount > 0;
  const wiseRef =
    deal.wise_reference ??
    `MS-${(deal.display_id ?? deal.id).slice(0, 8).toUpperCase()}`;

  return (
    <div>
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
        Payment &amp; Authorization
      </div>
      <h1
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: 24,
          fontWeight: 600,
          color: "#E5E5E5",
          letterSpacing: "0.02em",
          marginBottom: 8,
        }}
      >
        Secure Payment
      </h1>
      <p
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.65,
          marginBottom: 24,
          maxWidth: 680,
        }}
      >
        Your payment summary is generated from the Matter record. Courtesy
        adjustments are applied automatically and cannot be consumed until Wise
        confirms the exact payment amount and currency.
      </p>

      <div
        data-critical-card=""
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: GOLD_DIM,
                fontFamily: "monospace",
                marginBottom: 6,
              }}
            >
              Matter Payment
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              Reference {wiseRef}
            </div>
          </div>
          <StatusPill confirmed={paymentConfirmed} />
        </div>

        {originalTotal !== null && (
          <Row label="Original service total" value={money(originalTotal, currency)} />
        )}

        {courtesyApplied && (
          <>
            <Row
              label={
                deal.discount_value
                  ? `${deal.courtesy_label ?? "Professional courtesy"} · ${Number(deal.discount_value)}%`
                  : deal.courtesy_label ?? "Professional courtesy"
              }
              value={`−${money(discountAmount, currency)}`}
              positive
            />
            {finalTotal !== null && (
              <Row
                label="Final service total"
                value={money(finalTotal, currency)}
              />
            )}
          </>
        )}

        <Row
          label={paymentConfirmed ? "Verified payment" : "Amount due now"}
          value={
            paymentConfirmed
              ? "Confirmed"
              : amountDue !== null
                ? money(amountDue, currency)
                : "Pending final quote"
          }
          emphasis
          positive={paymentConfirmed}
        />
      </div>

      {!paymentConfirmed && amountDue !== null && amountDue > 0 && (
        <div
          style={{
            background: "rgba(198,165,90,0.04)",
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
              marginBottom: 10,
            }}
          >
            Wise Payment
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.65,
              marginBottom: 14,
            }}
          >
            Use the exact Wise reference shown above. Scheduling remains locked
            until the transfer is reconciled against the exact amount and
            currency.
          </p>

          {deal.wise_payment_url ? (
            <a
              href={deal.wise_payment_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 46,
                padding: "0 20px",
                borderRadius: 5,
                background: GOLD,
                color: "#0A0A0A",
                textDecoration: "none",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Continue to Secure Wise Payment
            </a>
          ) : (
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.6,
              }}
            >
              Payment instructions are being finalized. Your Matter remains
              safely unpaid and scheduling stays locked until the payment link is
              available.
            </div>
          )}
        </div>
      )}

      {paymentConfirmed && (
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(74,158,107,0.06) 0%, rgba(198,165,90,0.06) 100%)",
            border: "1px solid rgba(74,158,107,0.28)",
            borderRadius: 8,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: 15,
              fontWeight: 600,
              color: GREEN,
              marginBottom: 6,
            }}
          >
            Payment Verified
          </div>
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6,
            }}
          >
            Wise reconciliation is complete. Your payment gate is satisfied and
            scheduling may proceed through the canonical Matter workflow.
          </div>
        </div>
      )}
    </div>
  );
}
