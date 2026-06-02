"use client";

import { useState } from "react";

interface MilanoSealChatLauncherProps {
  operatorEmail?: string;
}

export function MilanoSealChatLauncher({ operatorEmail }: MilanoSealChatLauncherProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* floating trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Milano Seal concierge"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(8,5,1,0.97)",
          border: "1.5px solid #C6A55A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          boxShadow: "0 4px 24px rgba(198,165,90,0.25)",
          transition: "box-shadow 0.3s",
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20,
            color: "#C6A55A",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {open ? "×" : "M"}
        </span>
      </button>

      {/* panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            right: 24,
            width: 280,
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(198,165,90,0.3)",
            borderRadius: 4,
            padding: "16px",
            zIndex: 9998,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 13,
              color: "#C6A55A",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            The Milano Seal™
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(198,165,90,0.5)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Concierge
          </div>
          <div style={{ fontSize: 11, color: "rgba(198,165,90,0.7)", marginBottom: 12, lineHeight: 1.6 }}>
            For matter inquiries, status updates, or scheduling — please contact us directly.
          </div>
          <a
            href={`mailto:${operatorEmail ?? "contact@themilanoseal.com"}`}
            style={{
              display: "block",
              padding: "8px 12px",
              border: "1px solid rgba(198,165,90,0.4)",
              borderRadius: 2,
              color: "#C6A55A",
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            Email Concierge
          </a>
        </div>
      )}
    </>
  );
}
