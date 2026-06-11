"use client";

import { motion } from "framer-motion";

const GOLD = "#C6A55A";

export function CoordinatorCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
      style={{
        padding: "18px 20px",
        borderRadius: 4,
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(198,165,90,0.12)",
        boxShadow: "inset 0 1px 0 rgba(198,165,90,0.06)",
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.55)",
          marginBottom: 14,
        }}
      >
        Your Coordinator
      </div>

      {/* Monogram + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "rgba(198,165,90,0.08)",
            border: `1.5px solid rgba(198,165,90,0.25)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontFamily: "var(--font-playfair, Georgia, serif)",
            color: GOLD,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          NM
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "var(--font-playfair, Georgia, serif)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Nicholas Milano
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.3)",
              marginTop: 1,
            }}
          >
            Founder · The Milano Seal
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(255,255,255,0.04)", marginBottom: 14 }} />

      {/* Contact info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(74,158,107,0.7)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Available via portal messaging
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "rgba(198,165,90,0.4)",
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            Secure channel · End-to-end logged
          </span>
        </div>
      </div>

      {/* CTA */}
      <a
        href="/portal/messages"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 14,
          padding: "8px 0",
          borderRadius: 3,
          background: "rgba(198,165,90,0.06)",
          border: "1px solid rgba(198,165,90,0.18)",
          fontSize: 11,
          fontFamily: "monospace",
          letterSpacing: "0.06em",
          color: GOLD,
          textDecoration: "none",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        Message Your Coordinator →
      </a>

      <p
        style={{
          margin: "10px 0 0",
          fontSize: 9,
          textAlign: "center",
          color: "rgba(255,255,255,0.15)",
          fontFamily: "monospace",
        }}
      >
        Messages are reviewed within 1 business day
      </p>
    </motion.div>
  );
}
