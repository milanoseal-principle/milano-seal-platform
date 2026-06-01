"use client";

import type { ReceivingAuthority } from "@/data/authorities";

const GOLD = "#C6A55A";
const RED = "#e05252";

function confidenceBadgeColor(c: string): string {
  if (c === "AUTHORITY_VERIFIED") return "#4a9e6b";
  if (c === "MULTI_SOURCE_CONFIRMED") return "#4a9e6b";
  if (c === "PARTNER_CONFIRMED") return GOLD;
  if (c === "OBSERVED") return GOLD;
  return "rgba(255,255,255,0.3)";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function overdueStatus(nextReviewDue: string): { label: string; color: string } {
  const today = new Date();
  const due = new Date(nextReviewDue);
  const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 30) {
    return { label: `${diffDays} days overdue`, color: RED };
  }
  if (diffDays >= 0) {
    return { label: diffDays === 0 ? "Due today" : `${diffDays} days overdue`, color: GOLD };
  }
  const upcoming = Math.abs(diffDays);
  return { label: `Due in ${upcoming} days`, color: "rgba(255,255,255,0.35)" };
}

interface Props {
  authorities: ReceivingAuthority[];
}

export function ReviewQueue({ authorities }: Props) {
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
        Review Queue — {authorities.length}
      </div>

      {authorities.length === 0 ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          No authorities due for review.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {authorities.map((a, i) => {
            const badgeColor = confidenceBadgeColor(a.authority_confidence);
            const { label: overdueLabel, color: overdueColor } = overdueStatus(a.next_review_due!);
            return (
              <div
                key={a.id}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    i < authorities.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>
                      {a.authority_name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                        {a.country_name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: "monospace",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: badgeColor,
                          background: `${badgeColor}18`,
                          padding: "1px 6px",
                          borderRadius: 2,
                        }}
                      >
                        {a.authority_confidence.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      Due {formatDate(a.next_review_due!)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: overdueColor,
                      flexShrink: 0,
                      textAlign: "right",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {overdueLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
