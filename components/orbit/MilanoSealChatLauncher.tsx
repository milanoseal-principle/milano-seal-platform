"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";

export function MilanoSealChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes ms-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes ms-pulse2 {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.9); opacity: 0; }
        }
        .ms-orb-pulse::before,
        .ms-orb-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(198,165,90,0.35);
          animation: ms-pulse 2.4s ease-out infinite;
        }
        .ms-orb-pulse::after {
          background: rgba(198,165,90,0.18);
          animation: ms-pulse2 2.4s ease-out infinite 0.8s;
        }
      `}</style>

      {/* Orb button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Milano Seal concierge"
        className="ms-orb-pulse"
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #1a1408, #0d0a03)",
          border: "1.5px solid rgba(198,165,90,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 28px rgba(198,165,90,0.3), 0 0 0 1px rgba(198,165,90,0.1)",
          transition: "box-shadow 0.3s, border-color 0.3s",
          padding: 0,
        }}
      >
        {open ? (
          <X style={{ color: "#C6A55A", width: 22, height: 22 }} />
        ) : (
          <Image
            src="/milano-seal-gold-transparent-512.png"
            alt="The Milano Seal"
            width={36}
            height={36}
            style={{ objectFit: "contain", borderRadius: "50%" }}
          />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 28,
            width: 300,
            background: "rgba(8,6,2,0.98)",
            border: "1px solid rgba(198,165,90,0.25)",
            borderRadius: 8,
            zIndex: 9998,
            boxShadow: "0 16px 48px rgba(0,0,0,0.8), 0 0 0 1px rgba(198,165,90,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 16px 12px",
              borderBottom: "1px solid rgba(198,165,90,0.12)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Image
              src="/milano-seal-gold-transparent-512.png"
              alt="The Milano Seal"
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#C6A55A", letterSpacing: "0.08em" }}>
                The Milano Seal™
              </div>
              <div style={{ fontSize: 9, color: "rgba(198,165,90,0.45)", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 1 }}>
                Concierge
              </div>
            </div>
            <div
              style={{
                marginLeft: "auto",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "rgba(52,211,153,0.85)",
                boxShadow: "0 0 8px rgba(16,185,129,0.6)",
              }}
            />
          </div>

          {/* Body */}
          <div style={{ padding: "16px" }}>
            <p style={{ fontSize: 12, color: "rgba(176,176,176,0.9)", lineHeight: 1.65, marginBottom: 16 }}>
              Ready to execute your documents for international use. Begin a secure intake or reach us directly.
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
                borderRadius: 5,
                color: "#0A0A0A",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                marginBottom: 8,
              }}
            >
              Begin Secure Intake
              <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>

            <a
              href="mailto:contact@themilanoseal.com"
              style={{
                display: "block",
                padding: "9px 14px",
                border: "1px solid rgba(198,165,90,0.3)",
                borderRadius: 5,
                color: "rgba(198,165,90,0.8)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Email Concierge
            </a>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid rgba(198,165,90,0.08)",
              fontSize: 9,
              color: "rgba(198,165,90,0.3)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Secure · Founder-Led · Florida Licensed
          </div>
        </div>
      )}
    </>
  );
}
