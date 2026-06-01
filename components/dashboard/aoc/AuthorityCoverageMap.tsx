"use client";

import type { AuthorityCoverageEntry } from "@/data/authorities";

const EMERALD = "#4a9e6b";
const GOLD = "#C6A55A";
const UNKNOWN_COLOR = "#3A3A3A";
const RED = "#e05252";

interface Props {
  coverage: AuthorityCoverageEntry[];
}

function Bar({ count, color, label }: { count: number; color: string; label: string }) {
  if (count === 0) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, marginRight: 16 }}>
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: 1,
          background: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
        <span style={{ color, fontWeight: 600 }}>{count}</span> {label}
      </span>
    </span>
  );
}

export function AuthorityCoverageMap({ coverage }: Props) {
  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 2,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Authority Coverage
      </div>

      {coverage.length === 0 ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          No authority records in registry.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {coverage.map((c, i) => (
            <div
              key={c.country_iso}
              style={{
                padding: "12px 0",
                borderBottom:
                  i < coverage.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 6,
                }}
              >
                {c.country_name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
                <Bar count={c.verified} color={EMERALD} label="verified" />
                <Bar count={c.pending} color={GOLD} label="pending" />
                <Bar count={c.unknown} color={UNKNOWN_COLOR} label="unknown" />
                {c.demoted > 0 && <Bar count={c.demoted} color={RED} label="demoted" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
