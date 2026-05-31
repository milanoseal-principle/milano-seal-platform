"use client";

import type { AuthorityTimelineEvent, TimelineEventType } from "@/data/authorities";

const EMERALD = "#4a9e6b";
const GOLD = "#C6A55A";
const RED = "#e05252";
const DIM = "rgba(255,255,255,0.18)";

function dotColor(type: TimelineEventType): string {
  if (type === "CREATED") return DIM;
  if (type === "AUTHORITY_VERIFIED" || type === "MULTI_SOURCE_CONFIRMED") return EMERALD;
  if (type === "DEMOTED") return RED;
  return GOLD;
}

function formatEventType(type: TimelineEventType): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  authorityId: string;
  events: AuthorityTimelineEvent[];
}

export function AuthorityTimeline({ events }: Props) {
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
        Timeline
      </div>

      {events.length === 0 ? (
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          No timeline events recorded.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {events.map((e, i) => {
            const color = dotColor(e.event_type);
            const isLast = i === events.length - 1;
            return (
              <div key={e.id} style={{ display: "flex", gap: 12 }}>
                {/* Line + dot */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      border: `1px solid ${color}`,
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  {!isLast && (
                    <div
                      style={{
                        width: 1,
                        flex: 1,
                        background: "rgba(255,255,255,0.06)",
                        minHeight: 16,
                      }}
                    />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingBottom: isLast ? 0 : 12, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color,
                        fontWeight: 600,
                      }}
                    >
                      {formatEventType(e.event_type)}
                    </span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                      {formatDate(e.timestamp)}
                    </span>
                  </div>
                  {e.actor && e.actor !== "system" && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      {e.actor}
                    </div>
                  )}
                  {e.note && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, lineHeight: 1.4 }}>
                      {e.note}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
