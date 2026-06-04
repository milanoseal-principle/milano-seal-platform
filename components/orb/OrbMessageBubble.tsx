"use client";

import { useEffect, useState } from "react";

export interface OrbAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant: "primary" | "ghost";
}

export interface OrbMessage {
  id: string;
  role: "orb" | "user";
  content: string;
  timestamp: Date;
  actions?: OrbAction[];
}

interface OrbMessageBubbleProps {
  message: OrbMessage;
}

export function OrbMessageBubble({ message }: OrbMessageBubbleProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const isOrb = message.role === "orb";

  const formattedTime = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isOrb ? "flex-start" : "flex-end",
        gap: 4,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      {/* Bubble */}
      <div
        style={{
          maxWidth: "85%",
          padding: "8px 12px",
          borderRadius: isOrb ? "2px 12px 12px 12px" : "12px 2px 12px 12px",
          background: isOrb ? "rgba(198,165,90,0.08)" : "rgba(198,165,90,0.15)",
          border: `1px solid ${isOrb ? "rgba(198,165,90,0.18)" : "rgba(198,165,90,0.25)"}`,
          color: isOrb ? "rgba(198,165,90,0.9)" : "#FFFFFF",
          fontSize: 13,
          lineHeight: 1.5,
          fontFamily: "'Inter', sans-serif",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
      </div>

      {/* Timestamp */}
      <span
        style={{
          fontSize: 9,
          color: "rgba(198,165,90,0.4)",
          letterSpacing: "0.05em",
          paddingLeft: isOrb ? 2 : 0,
          paddingRight: isOrb ? 0 : 2,
        }}
      >
        {formattedTime}
      </span>

      {/* Actions */}
      {message.actions && message.actions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {message.actions.map((action, i) => {
            const isPrimary = action.variant === "primary";
            const sharedStyle: React.CSSProperties = {
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.04em",
              border: `1px solid ${isPrimary ? "#C6A55A" : "rgba(198,165,90,0.4)"}`,
              background: isPrimary ? "rgba(198,165,90,0.15)" : "transparent",
              color: "#C6A55A",
              textDecoration: "none",
              transition: "background 150ms",
            };

            if (action.href) {
              return (
                <a key={i} href={action.href} style={sharedStyle}>
                  {action.label}
                </a>
              );
            }

            return (
              <button key={i} onClick={action.onClick} style={sharedStyle}>
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
