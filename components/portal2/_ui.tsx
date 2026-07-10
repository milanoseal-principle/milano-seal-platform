// Client Portal 2.0 — shared presentational primitives (premium black/gold).
// Plain presentational helpers; no hooks, safe to import anywhere.

import type { ReactNode } from "react";

export const GOLD = "#C6A55A";
export const GOLD_FAINT = "rgba(198,165,90,0.14)";
export const GOLD_MID = "rgba(198,165,90,0.45)";
export const INK = "rgba(255,255,255,0.55)";
export const INK_DIM = "rgba(255,255,255,0.38)";

export function Panel({
  title,
  eyebrow,
  children,
  action,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      style={{
        background: "rgba(255,255,255,0.012)",
        border: `1px solid ${GOLD_FAINT}`,
        borderRadius: 8,
        padding: "22px 24px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          {eyebrow && (
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontFamily: "monospace",
                color: "rgba(198,165,90,0.5)",
                marginBottom: 6,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: GOLD,
              fontFamily: "var(--font-serif, Georgia, serif)",
              letterSpacing: "0.01em",
            }}
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        border: `1px dashed ${GOLD_FAINT}`,
        borderRadius: 6,
        padding: "18px 16px",
        fontSize: 12.5,
        lineHeight: 1.6,
        color: INK_DIM,
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}

export function SampleBadge() {
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: "monospace",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: GOLD,
        border: `1px solid ${GOLD_MID}`,
        borderRadius: 99,
        padding: "2px 8px",
        background: "rgba(198,165,90,0.06)",
      }}
    >
      Sample
    </span>
  );
}

export function StateDot({ state }: { state: "complete" | "current" | "upcoming" | "in_progress" | "pending" }) {
  const done = state === "complete";
  const active = state === "current" || state === "in_progress";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        flexShrink: 0,
        borderRadius: "50%",
        fontSize: 10,
        fontWeight: 600,
        background: done ? GOLD : active ? "rgba(198,165,90,0.12)" : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${done ? GOLD : active ? GOLD : GOLD_FAINT}`,
        color: done ? "#1a1507" : active ? GOLD : "rgba(255,255,255,0.28)",
      }}
    >
      {done ? "✓" : active ? "●" : "○"}
    </span>
  );
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
