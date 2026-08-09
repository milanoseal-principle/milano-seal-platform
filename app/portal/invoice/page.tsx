"use client";

import { usePortal } from "@/components/portal/portal-context";

const GOLD = "#C6A55A";
const GREEN = "#4a9e6b";
const BORDER = "rgba(198,165,90,0.18)";

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

function Line({
  label,
  value,
  positive,
  strong,
}: {
  label: string;
  value: string;
  positive?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 20,
        padding: "12px 0",
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.46)" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: strong ? 15 : 13,
          fontWeight: strong ? 700 : 500,
          color: positive ? GREEN : strong ? GOLD : "#E5E5E5",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ClientInvoicePage() {
  const { deal, isLoading } = usePortal();

  if (isLoading) {
    return (
      <div style={{ color: "rgba(255,255,255,.4)" }}>
        Verifying invoice state…
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

  const complimentaryAuthorized =
    deal.payment_disposition === "complimentary" && deal.comp_authorized === true;
  const paymentConfirmed =
    deal.payment_confirmed ||
    deal.payment_status === "paid" ||
    deal.payment_status === "confirmed" ||
    deal.payment_status === "payment_confirmed";

  const currency = deal.currency ?? "USD";
  const amountDue = deal.amount_due ?? deal.payment_amount_due ?? null;
  const courtesyApplied = deal.courtesy_applied && deal.discount_amount > 0;
  const wiseRef =
    deal.wise_reference ??
    `MS-${(deal.display_id ?? deal.id).slice(0, 8).toUpperCase()}`;

  if (complimentaryAuthorized) {
    return (
      <div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.58)",
            fontFamily: "monospace",
            marginBottom: 8,
          }}
        >
          Invoice &amp; Authorization
        </div>
        <h1
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: 24,
            color: "#E5E5E5",
            marginBottom: 8,
          }}
        >
          Complimentary Service Authorization
        </h1>
        <p
          style={{
            marginBottom: 24,
            maxWidth: 680,
            fontSize: 12,
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.48)",
          }}
        >
          No payment is due for this Matter. This authorization is a separate
          zero-revenue disposition and is not a paid status or Wise Payment
          Confirmed status.
        </p>
        <div
          data-critical-card=""
          style={{
            background: "rgba(74,158,107,0.06)",
            border: "1px solid rgba(74,158,107,0.28)",
            borderRadius: 8,
            padding: "22px 26px",
          }}
        >
          {deal.original_total !== null && (
            <Line
              label="Original service value"
              value={money(deal.original_total, currency)}
            />
          )}
          <Line label="Authorized amount due" value={money(0, currency)} strong positive />
          <div
            style={{
              paddingTop: 16,
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              lineHeight: 1.65,
            }}
          >
            Scheduling eligibility is evaluated through the canonical
            Complimentary Authorization gate. No Wise payment or payment
            confirmation is fabricated for this Matter.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.58)",
          fontFamily: "monospace",
          marginBottom: 8,
        }}
      >
        Invoice &amp; Payment Authorization
      </div>

      <h1
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: 24,
          color: "#E5E5E5",
          marginBottom: 8,
        }}
      >
        Your Matter Invoice
      </h1>

      <p
        style={{
          marginBottom: 24,
          maxWidth: 680,
          fontSize: 12,
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        This invoice reflects the server-authoritative Matter amount. Any
        professional courtesy attached to your Matter is applied automatically;
        no coupon entry is required.
      </p>

      <div
        data-critical-card=""
        style={{
          background: "rgba(255,255,255,0.01)",
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          padding: "24px 28px",
          marginBottom: 16,
        }}
      >
        <Line label="Matter reference" value={wiseRef} />
        {deal.original_total !== null && (
          <Line
            label="Original service total"
            value={money(deal.original_total, currency)}
          />
        )}

        {courtesyApplied && (
          <>
            <Line
              label={
                deal.discount_value
                  ? `${deal.courtesy_label ?? "Professional courtesy"} · ${Number(deal.discount_value)}%`
                  : deal.courtesy_label ?? "Professional courtesy"
              }
              value={`−${money(deal.discount_amount, currency)}`}
              positive
            />
            {deal.final_total !== null && (
              <Line
                label="Final service total"
                value={money(deal.final_total, currency)}
              />
            )}
          </>
        )}

        <Line
          label={paymentConfirmed ? "Payment status" : "Amount due now"}
          value={
            paymentConfirmed
              ? "Verified"
              : amountDue !== null
                ? money(amountDue, currency)
                : "Pending final quote"
          }
          strong
          positive={paymentConfirmed}
        />
      </div>

      {!paymentConfirmed && amountDue !== null && amountDue > 0 && (
        <div
          style={{
            background: "rgba(198,165,90,0.04)",
            border: `1px solid ${BORDER}`,
            borderRadius: 8,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 10,
              fontFamily: "monospace",
            }}
          >
            Wise Business
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.65,
              marginBottom: 14,
            }}
          >
            Use reference <strong style={{ color: GOLD }}>{wiseRef}</strong>.
            Scheduling remains locked until Wise confirms the exact amount and
            currency.
          </p>

          {deal.wise_payment_url ? (
            <a
              href={deal.wise_payment_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                minHeight: 46,
                alignItems: "center",
                justifyContent: "center",
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
              Your secure Wise payment link is being finalized. No payment or
              courtesy redemption is recorded until reconciliation succeeds.
            </div>
          )}
        </div>
      )}

      {paymentConfirmed && (
        <div
          style={{
            background: "rgba(74,158,107,0.06)",
            border: "1px solid rgba(74,158,107,0.28)",
            borderRadius: 8,
            padding: "18px 22px",
            color: GREEN,
            fontSize: 13,
          }}
        >
          Payment verified. Scheduling is now eligible to proceed through the
          canonical Matter workflow.
        </div>
      )}
    </div>
  );
}
