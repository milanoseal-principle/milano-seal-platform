"use client";

interface WiseTransferInstructionsProps {
  wiseReference: string;
  currency?: string;
  amountDue?: number;
}

export function WiseTransferInstructions({
  wiseReference,
  currency = "USD",
  amountDue,
}: WiseTransferInstructionsProps) {
  return (
    <div
      style={{
        background: "rgba(198,165,90,0.04)",
        border: "1px solid rgba(198,165,90,0.18)",
        borderRadius: 6,
        padding: "20px 24px",
        marginTop: 12,
      }}
    >
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.6)",
          marginBottom: 14,
        }}
      >
        Wire Transfer Instructions
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <p
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: 3,
            }}
          >
            Payment Method
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            Wise Business Transfer
          </p>
        </div>

        <div>
          <p
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: 3,
            }}
          >
            Account Name
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            The Milano Seal LLC
          </p>
        </div>

        {amountDue !== undefined && amountDue > 0 && (
          <div>
            <p
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 3,
              }}
            >
              Amount
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
              {currency}{" "}
              {amountDue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        )}

        <div>
          <p
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              marginBottom: 3,
            }}
          >
            Required Reference
          </p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 14,
              fontWeight: 600,
              color: "#C6A55A",
              userSelect: "all",
              letterSpacing: "0.06em",
            }}
          >
            {wiseReference}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            Include this reference exactly as shown — it&apos;s how we match
            your payment automatically.
          </p>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid rgba(198,165,90,0.1)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
          }}
        >
          After payment, Wise typically notifies us within minutes. Scheduling
          unlocks automatically once confirmed.
        </p>
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            marginTop: 6,
            lineHeight: 1.6,
          }}
        >
          If you need assistance, contact your coordinator directly.
        </p>
      </div>
    </div>
  );
}
