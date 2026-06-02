"use client";

import Link from "next/link";

interface CourierAction {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  description: string;
  actionLabel: string;
  actionRoute: string;
}

const COURIER_ACTIONS: CourierAction[] = [
  {
    id: "address_correction",
    severity: "HIGH",
    title: "Address Correction Pending Approval",
    description:
      "A shipment has an address correction request that requires operator review before re-dispatch.",
    actionLabel: "Review Shipments",
    actionRoute: "/dashboard/shipping",
  },
  {
    id: "label_not_registered",
    severity: "MEDIUM",
    title: "Label Created — Tracking Not Registered",
    description:
      "Label was created but no tracking scan has been recorded. Confirm pickup with carrier.",
    actionLabel: "View Shipping Center",
    actionRoute: "/dashboard/shipping",
  },
  {
    id: "no_label_after_apostille",
    severity: "HIGH",
    title: "Apostille Complete — No Label Created",
    description:
      "Apostille is complete but courier label has not been generated. Action required.",
    actionLabel: "Create Label",
    actionRoute: "/dashboard/shipping",
  },
  {
    id: "courier_exception",
    severity: "CRITICAL",
    title: "Courier Exception Requires Review",
    description:
      "A delivery exception has been flagged by the carrier. Operator must assess and respond.",
    actionLabel: "Review Exceptions",
    actionRoute: "/dashboard/shipping",
  },
  {
    id: "returned_document",
    severity: "CRITICAL",
    title: "Returned Document — Operator Action Required",
    description:
      "A shipment was returned to sender. Operator must assess cause and arrange re-shipment.",
    actionLabel: "View Returned",
    actionRoute: "/dashboard/shipping",
  },
  {
    id: "delivered_not_released",
    severity: "HIGH",
    title: "Delivered But Not Released",
    description:
      "Document has been delivered but release review has not been completed.",
    actionLabel: "Release Review Queue",
    actionRoute: "/dashboard/releases",
  },
  {
    id: "tracking_stale",
    severity: "MEDIUM",
    title: "Tracking Stale (>48 Hours)",
    description:
      "No tracking update in over 48 hours. Verify with carrier that shipment is progressing.",
    actionLabel: "View Shipping Center",
    actionRoute: "/dashboard/shipping",
  },
  {
    id: "certificate_ready",
    severity: "MEDIUM",
    title: "Certificate Ready for Release Review",
    description:
      "A release certificate is ready for operator review and approval.",
    actionLabel: "Release Review",
    actionRoute: "/dashboard/releases",
  },
];

const SEVERITY_STYLE: Record<
  "CRITICAL" | "HIGH" | "MEDIUM",
  { text: string; border: string; bg: string }
> = {
  CRITICAL: {
    text: "#B85C5C",
    border: "rgba(184,92,92,0.35)",
    bg: "rgba(184,92,92,0.07)",
  },
  HIGH: {
    text: "#C99A3D",
    border: "rgba(201,154,61,0.3)",
    bg: "rgba(201,154,61,0.06)",
  },
  MEDIUM: {
    text: "#C6A55A",
    border: "rgba(198,165,90,0.25)",
    bg: "rgba(198,165,90,0.05)",
  },
};

export function CourierCopilotSection() {
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(198,165,90,0.12)",
        borderRadius: 4,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Courier Intelligence Actions
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 10,
        }}
      >
        {COURIER_ACTIONS.map((action) => {
          const style = SEVERITY_STYLE[action.severity];
          return (
            <div
              key={action.id}
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 3,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    fontFamily: "monospace",
                    padding: "2px 6px",
                    borderRadius: 2,
                    border: `1px solid ${style.border}`,
                    color: style.text,
                    flexShrink: 0,
                  }}
                >
                  {action.severity}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.8)",
                    lineHeight: 1.3,
                  }}
                >
                  {action.title}
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.5,
                }}
              >
                {action.description}
              </p>

              <Link
                href={action.actionRoute}
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: style.text,
                  textDecoration: "none",
                  marginTop: 2,
                }}
              >
                {action.actionLabel} →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
