"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export function MilanoSealChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes ms-panel-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ms-launcher-btn {
          transition: box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .ms-launcher-btn:hover {
          box-shadow: 0 0 0 1px rgba(198,165,90,0.35), 0 8px 32px rgba(198,165,90,0.15);
          border-color: rgba(198,165,90,0.6) !important;
        }
        .ms-panel-anim {
          animation: ms-panel-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
        }
      `}</style>

      {/* Button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Milano Seal concierge"
        className="ms-launcher-btn"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: 4,
          background: "rgba(8,6,2,0.96)",
          border: "1px solid rgba(198,165,90,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          padding: 0,
          boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
        }}
      >
        {open ? (
          <X style={{ color: "rgba(198,165,90,0.7)", width: 16, height: 16 }} />
        ) : (
          <span style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: 20,
            fontWeight: 400,
            color: "#C6A55A",
            lineHeight: 1,
            letterSpacing: "0.02em",
            userSelect: "none",
          }}>M</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="ms-panel-anim"
          style={{
            position: "fixed",
            bottom: 78,
            right: 24,
            width: 280,
            background: "rgba(8,6,2,0.98)",
            border: "1px solid rgba(198,165,90,0.2)",
            borderRadius: 4,
            zIndex: 9998,
            boxShadow: "0 12px 48px rgba(0,0,0,0.8)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "12px 16px",
            borderBottom: "1px solid rgba(198,165,90,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#C6A55A", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                The Milano Seal™
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>
                Document Execution · Florida Licensed
              </div>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(52,211,153,0.8)", flexShrink: 0 }} />
          </div>

          {/* Body */}
          <div style={{ padding: "14px 16px 16px" }}>
            <p style={{ fontSize: 11, color: "rgba(176,176,176,0.8)", lineHeight: 1.6, marginBottom: 14, margin: "0 0 14px" }}>
              Ready to execute your international documents. Begin a secure intake or reach us directly.
            </p>

            <Link
              href="/intake"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#C6A55A",
                borderRadius: 3,
                color: "#0A0A0A",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
                marginBottom: 8,
              }}
            >
              Begin Secure Intake
              <span style={{ fontSize: 12, marginLeft: 4 }}>→</span>
            </Link>

            <a
              href="mailto:contact@themilanoseal.com"
              style={{
                display: "block",
                padding: "9px 14px",
                border: "1px solid rgba(198,165,90,0.22)",
                borderRadius: 3,
                color: "rgba(198,165,90,0.7)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Email Concierge
            </a>
          </div>
        </div>
      )}
    </>
  );
}
