"use client";

import { motion } from "framer-motion";

const GOLD = "var(--ms-gold)";

interface RouteInfo {
  label: string;
  purpose: string;
  features: string[];
}

const ROUTE_MAP: Record<string, RouteInfo> = {
  "/portal": {
    label: "Secure Matter Portal",
    purpose: "Access your active matter, track execution progress, and coordinate with your document specialist.",
    features: [
      "Real-time execution status",
      "Payment-gated scheduling",
      "Secure document coordination",
      "Coordinator messaging",
    ],
  },
  "/portal/tracking": {
    label: "Document Tracking",
    purpose: "Track your document through apostille processing and international courier delivery.",
    features: [
      "Live courier status",
      "Delivery confirmation",
      "Apostille processing timeline",
      "Evidence packet access",
    ],
  },
  "/portal/invoice": {
    label: "Invoice & Payment",
    purpose: "Review your execution invoice and confirm payment to unlock scheduling.",
    features: [
      "Itemized execution invoice",
      "Secure payment confirmation",
      "Balance and retainer summary",
      "Paid & Released status",
    ],
  },
  "/portal/documents": {
    label: "The Vault",
    purpose: "Upload required documents and access executed, apostilled, and released files.",
    features: [
      "Secure document upload",
      "Signed URL document access",
      "Verification status tracking",
      "Released document download",
    ],
  },
  "/portal/messages": {
    label: "Coordinator Messages",
    purpose: "Communicate directly with your execution coordinator through a secure channel.",
    features: [
      "Encrypted message thread",
      "Coordinator response within 1 business day",
      "Matter-scoped communication",
      "End-to-end logged",
    ],
  },
};

function getRouteInfo(path: string): RouteInfo {
  return (
    ROUTE_MAP[path] ??
    ROUTE_MAP["/portal"] ?? {
      label: "Secure Matter Portal",
      purpose: "Access your private matter portal.",
      features: [],
    }
  );
}

interface Props {
  nextPath?: string;
}

export function PortalAccessShell({ nextPath = "/portal" }: Props) {
  const info = getRouteInfo(nextPath);
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050505",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "100%", maxWidth: 420 }}
      >
        {/* Brand mark */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: GOLD,
              marginBottom: 8,
            }}
          >
            The Milano Seal
          </div>
          <div
            style={{
              width: 32,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
              margin: "0 auto",
            }}
          />
        </div>

        {/* Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.01)",
            border: "1px solid rgba(198,165,90,0.18)",
            borderRadius: 6,
            padding: "32px 28px",
            boxShadow: "0 0 60px rgba(198,165,90,0.04), inset 0 1px 0 rgba(198,165,90,0.06)",
          }}
        >
          {/* Lock icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(198,165,90,0.06)",
              border: "1.5px solid rgba(198,165,90,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 16,
            }}
          >
            🔒
          </div>

          <h1
            style={{
              margin: "0 0 6px",
              fontSize: 18,
              fontWeight: 300,
              fontFamily: "var(--font-playfair, Georgia, serif)",
              color: "rgba(255,255,255,0.85)",
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {info.label}
          </h1>

          <p
            style={{
              margin: "0 0 24px",
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {info.purpose}
          </p>

          {/* Feature list */}
          {info.features.length > 0 && (
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                padding: "16px 0",
                marginBottom: 24,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {info.features.map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: GOLD,
                      flexShrink: 0,
                      opacity: 0.7,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <a
            href={loginHref}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              padding: "12px 0",
              borderRadius: 4,
              background: "rgba(198,165,90,0.08)",
              border: "1px solid rgba(198,165,90,0.3)",
              fontSize: 12,
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: GOLD,
              textDecoration: "none",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            Access My Matter →
          </a>

          <p
            style={{
              marginTop: 12,
              fontSize: 9,
              textAlign: "center",
              color: "rgba(255,255,255,0.15)",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
          >
            Protected access · No matter data is visible before login
          </p>
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: 24,
            fontSize: 9,
            textAlign: "center",
            color: "rgba(255,255,255,0.1)",
            fontFamily: "monospace",
            letterSpacing: "0.06em",
          }}
        >
          © The Milano Seal · International Document Execution
        </p>
      </motion.div>
    </div>
  );
}
