"use client";

import { motion } from "framer-motion";

const GOLD = "var(--ms-gold)";
const EMERALD = "#4a9e6b";

export interface PricingBreakdownData {
  lane: string | null;
  basePrice: number | null;
  retainerPaid: number | null;
  addOns: Array<{ label: string; amount: number }>;
  included: string[];
  total: number | null;
  balanceDue: number | null;
  paymentStatus: string | null;
  wiseReference: string | null;
}

interface Props {
  data: PricingBreakdownData;
  /** compact = no included features list, no action button */
  compact?: boolean;
  /** Called when "Continue to Secure Payment" is clicked */
  onPaymentAction?: () => void;
  showPaymentButton?: boolean;
}

function fmt(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isConfirmedPaid(status: string | null): boolean {
  return status === "paid" || status === "confirmed" || status === "payment_confirmed";
}

export function PricingBreakdown({ data, compact = false, onPaymentAction, showPaymentButton = false }: Props) {
  const paid = isConfirmedPaid(data.paymentStatus);
  const hasBalance = (data.balanceDue ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(255,255,255,0.01)",
        border: `1px solid ${paid ? "rgba(74,158,107,0.2)" : "rgba(198,165,90,0.14)"}`,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {/* Lane badge header */}
      {data.lane && (
        <div
          style={{
            padding: "10px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(198,165,90,0.03)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: GOLD,
            }}
          >
            {data.lane} Lane
          </div>
          {paid && (
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontFamily: "monospace",
                color: EMERALD,
              }}
            >
              Paid & Confirmed
            </div>
          )}
        </div>
      )}

      {/* Line items */}
      <div style={{ padding: "16px 18px" }}>
        {data.basePrice != null && (
          <LineItem label="Execution services" amount={data.basePrice} />
        )}

        {data.addOns.map((a) => (
          <LineItem key={a.label} label={a.label} amount={a.amount} />
        ))}

        {data.retainerPaid != null && data.retainerPaid > 0 && (
          <LineItem
            label="Retainer applied"
            amount={-data.retainerPaid}
            credit
          />
        )}

        {/* Subtotal divider */}
        {data.total != null && (
          <>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                margin: "10px 0",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: GOLD,
                  fontFamily: "monospace",
                }}
              >
                {fmt(data.total)}
              </span>
            </div>
          </>
        )}

        {data.balanceDue != null && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              Balance due
            </span>
            <span
              style={{
                fontSize: 12,
                color: hasBalance ? "rgba(255,100,80,0.8)" : EMERALD,
                fontFamily: "monospace",
              }}
            >
              {hasBalance ? fmt(data.balanceDue) : "Paid"}
            </span>
          </div>
        )}

        {data.wiseReference && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
              Wise reference
            </span>
            <span
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                fontFamily: "monospace",
              }}
            >
              {data.wiseReference}
            </span>
          </div>
        )}
      </div>

      {/* Included features */}
      {!compact && data.included.length > 0 && (
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: "rgba(255,255,255,0.2)",
              marginBottom: 8,
            }}
          >
            Included
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {data.included.map((f) => (
              <div
                key={f}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: GOLD,
                    flexShrink: 0,
                    opacity: 0.5,
                  }}
                />
                <span
                  style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment action */}
      {!compact && showPaymentButton && !paid && hasBalance && onPaymentAction && (
        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <button
            onClick={onPaymentAction}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 4,
              background: "rgba(198,165,90,0.08)",
              border: "1px solid rgba(198,165,90,0.3)",
              color: GOLD,
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(198,165,90,0.14)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(198,165,90,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(198,165,90,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(198,165,90,0.3)";
            }}
          >
            Continue to Secure Payment
          </button>
          <p
            style={{
              marginTop: 8,
              fontSize: 9,
              textAlign: "center",
              color: "rgba(255,255,255,0.15)",
              fontFamily: "monospace",
            }}
          >
            Payment confirmation handled by your coordinator · Wise preferred
          </p>
        </div>
      )}
    </motion.div>
  );
}

function LineItem({
  label,
  amount,
  credit = false,
}: {
  label: string;
  amount: number;
  credit?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: credit ? EMERALD : "rgba(255,255,255,0.6)",
          fontFamily: "monospace",
        }}
      >
        {credit ? "−" : ""}{fmt(Math.abs(amount))}
      </span>
    </div>
  );
}
