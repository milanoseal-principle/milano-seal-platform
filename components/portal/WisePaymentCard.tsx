"use client";

import { useState } from "react";
import { WiseTransferInstructions } from "./WiseTransferInstructions";

export interface WisePaymentCardProps {
  amountDue: number;
  currency: string;
  paymentStatus: string; // "pending" | "awaiting_payment" | "paid"
  wiseReference: string; // e.g. "MS-ITALY-TEST-001"
  wisePaymentUrl?: string | null;
  paidAt?: string | null;
}

export function WisePaymentCard({
  amountDue,
  currency,
  paymentStatus,
  wiseReference,
  wisePaymentUrl,
  paidAt,
}: WisePaymentCardProps) {
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const isPaid =
    paymentStatus === "paid" ||
    paymentStatus === "confirmed" ||
    paymentStatus === "payment_confirmed";

  const formattedAmount = amountDue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedPaidAt = paidAt
    ? new Date(paidAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  async function copyReference() {
    try {
      await navigator.clipboard.writeText(wiseReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  }

  if (isPaid) {
    return (
      <div
        style={{
          background: "#0A0A0A",
          border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: 8,
          padding: "24px 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: formattedPaidAt ? 14 : 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ color: "#22c55e", fontSize: 16, lineHeight: 1 }}>
              ✓
            </span>
          </div>
          <div>
            <p
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 16,
                fontWeight: 600,
                color: "#ffffff",
                marginBottom: 4,
              }}
            >
              Payment Confirmed
            </p>
            <p style={{ fontSize: 12, color: "#22c55e", fontWeight: 500 }}>
              Scheduling Unlocked
            </p>
          </div>
        </div>

        {formattedPaidAt && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              gap: 24,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 3,
                }}
              >
                Paid At
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                  fontFamily: "monospace",
                }}
              >
                {formattedPaidAt}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 3,
                }}
              >
                Amount
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.65)",
                  fontFamily: "monospace",
                }}
              >
                {currency} {formattedAmount}
              </p>
            </div>
          </div>
        )}

        <p
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.28)",
            marginTop: 14,
            lineHeight: 1.6,
          }}
        >
          The Milano Seal provides document coordination, notarization support,
          apostille/authentication routing review, courier custody, and release
          support. International use remains subject to destination-country,
          receiving-authority, document-type, and signer-location requirements.
          This assistant does not provide legal advice or guarantee foreign
          acceptance.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0A0A0A",
        border: "1px solid rgba(198,165,90,0.2)",
        borderRadius: 8,
        padding: "24px 28px",
      }}
    >
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Payment Required
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Amount Due */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              fontFamily: "monospace",
              letterSpacing: "0.06em",
            }}
          >
            Amount Due
          </span>
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--ms-gold)",
              letterSpacing: "0.02em",
            }}
          >
            {currency === "USD" ? "$" : currency + " "}
            {formattedAmount}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        />

        {/* Status rows */}
        {[
          { label: "Payment Status", value: "Awaiting Payment" },
          { label: "Payment Method", value: "Wise Business Transfer" },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                fontFamily: "monospace",
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {value}
            </span>
          </div>
        ))}

        {/* Reference row */}
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
              color: "rgba(255,255,255,0.35)",
              fontFamily: "monospace",
              letterSpacing: "0.06em",
            }}
          >
            Payment Reference
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ms-gold)",
                userSelect: "all",
                letterSpacing: "0.05em",
              }}
            >
              {wiseReference}
            </span>
            <button
              onClick={copyReference}
              title="Copy reference"
              style={{
                background: "transparent",
                border: "1px solid rgba(198,165,90,0.3)",
                borderRadius: 4,
                padding: "3px 8px",
                cursor: "pointer",
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: "0.08em",
                color: copied ? "#22c55e" : "rgba(198,165,90,0.7)",
                transition: "color 0.15s, border-color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 20 }}>
        {wisePaymentUrl ? (
          <a
            href={wisePaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              background: "var(--ms-gold)",
              color: "#0A0A0A",
              padding: "12px 20px",
              borderRadius: 5,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.88")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
            }
          >
            Pay Securely with Wise
          </a>
        ) : (
          <button
            onClick={() => setShowInstructions((v) => !v)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              background: "transparent",
              border: "1px solid var(--ms-gold)",
              color: "var(--ms-gold)",
              padding: "12px 20px",
              borderRadius: 5,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "rgba(198,165,90,0.08)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background =
                "transparent")
            }
          >
            {showInstructions ? "Hide Instructions" : "View Transfer Instructions"}
          </button>
        )}
      </div>

      {/* Transfer instructions fallback */}
      {!wisePaymentUrl && showInstructions && (
        <WiseTransferInstructions
          wiseReference={wiseReference}
          currency={currency}
          amountDue={amountDue}
        />
      )}

      {/* Scheduling locked message */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "10px 14px",
          background: "rgba(198,165,90,0.04)",
          border: "1px solid rgba(198,165,90,0.12)",
          borderRadius: 5,
        }}
      >
        <span style={{ color: "var(--ms-gold)", fontSize: 10, marginTop: 1, flexShrink: 0 }}>
          ●
        </span>
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.6,
          }}
        >
          Scheduling locked. Scheduling unlocks automatically once Wise confirms
          your payment.
        </p>
      </div>

      <p
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.22)",
          marginTop: 14,
          lineHeight: 1.6,
        }}
      >
        The Milano Seal provides document coordination, notarization support,
        apostille/authentication routing review, courier custody, and release
        support. International use remains subject to destination-country,
        receiving-authority, document-type, and signer-location requirements.
        This service does not provide legal advice or guarantee foreign
        acceptance.
      </p>
    </div>
  );
}
