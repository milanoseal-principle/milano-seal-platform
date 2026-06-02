"use client";

import { motion } from "framer-motion";
import type { DNAResult, CorridorDNA } from "@/app/dashboard/dna/page";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(v: number) {
  return v === 0 ? "—" : `$${v.toLocaleString()}`;
}

function fmtPct(v: number) {
  return `${v}%`;
}

function fmtDays(v: number | null) {
  if (v === null) return "—";
  return `${v}d`;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STATUS_CONFIG: Record<
  CorridorDNA["status"],
  { label: string; color: string }
> = {
  single: { label: "SINGLE", color: "rgba(255,255,255,0.25)" },
  emerging: { label: "EMERGING", color: "#f59e0b" },
  established: { label: "ESTABLISHED", color: "#C6A55A" },
  proven: { label: "PROVEN", color: "#4a9e6b" },
};

const LANE_COLOR: Record<string, string> = {
  standard: "rgba(255,255,255,0.35)",
  expedited: "#C6A55A",
  urgent: "#f59e0b",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryChip({
  label,
  value,
  gold,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 8,
        padding: "12px 18px",
        flex: 1,
        minWidth: 120,
      }}
    >
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 22,
          fontWeight: 600,
          color: gold ? "#C6A55A" : "rgba(255,255,255,0.9)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: CorridorDNA["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 8,
        letterSpacing: "0.24em",
        color: cfg.color,
        border: `1px solid ${cfg.color}`,
        borderRadius: 3,
        padding: "2px 5px",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        textAlign: "center",
        padding: "60px 24px",
      }}
    >
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          letterSpacing: "0.32em",
          color: "rgba(198,165,90,0.4)",
          marginBottom: 24,
        }}
      >
        DNA ACCUMULATION PENDING
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 14,
          maxWidth: 420,
          lineHeight: 1.7,
          marginBottom: 28,
        }}
      >
        The Execution DNA Engine builds intelligence from completed matter
        history. As matters close, this system extracts:
      </p>
      {[
        "Fastest verified routes per corridor",
        "Most common corrections",
        "Average execution timelines",
        "Authority risk patterns",
      ].map((line) => (
        <p
          key={line}
          style={{
            color: "rgba(198,165,90,0.55)",
            fontSize: 13,
            marginBottom: 6,
          }}
        >
          • {line}
        </p>
      ))}
      <p
        style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: 12,
          marginTop: 28,
          letterSpacing: "0.06em",
        }}
      >
        Every matter that completes makes this system more accurate.
        <br />
        This is the institutional moat.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExecutionDNA({ dna }: { dna: DNAResult }) {
  const top5 = dna.corridors.slice(0, 5);
  const top3 = dna.corridors.slice(0, 3);
  const maxCount = top5[0]?.matter_count ?? 1;

  const laneRows = ["standard", "expedited", "urgent"].map((lane) => ({
    lane,
    ...(dna.lane_efficiency[lane] ?? { count: 0, avg_days: null }),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        padding: "32px 24px",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.5)",
            marginBottom: 8,
          }}
        >
          INTELLIGENCE · EXECUTION DNA
        </p>
        <h1
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Execution DNA Engine
        </h1>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginTop: 4 }}>
          Route intelligence extracted from completed matter history
        </p>
      </div>

      {/* Empty state */}
      {dna.total_completed === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* ── Section 1: Summary Strip ─────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            <SummaryChip
              label="Matters Analyzed"
              value={String(dna.total_completed)}
            />
            <SummaryChip
              label="Corridors Mapped"
              value={String(dna.total_corridors)}
              gold={dna.total_corridors > 0}
            />
            <SummaryChip
              label="Countries Covered"
              value={String(dna.total_countries)}
            />
            <SummaryChip
              label="Avg Completion"
              value={fmtDays(dna.global_avg_days)}
            />
          </div>

          {/* ── Section 2: Corridor Registry Table ───────────────────────── */}
          <div style={{ marginBottom: 32 }}>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(198,165,90,0.5)",
                marginBottom: 16,
              }}
            >
              CORRIDOR REGISTRY
            </p>
            <div
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1.4fr 1.6fr 80px 110px 80px 100px 80px 80px",
                  padding: "10px 16px",
                  borderBottom: "1px solid rgba(212,175,55,0.06)",
                }}
              >
                {[
                  "Country",
                  "Document Type",
                  "Matters",
                  "Status",
                  "Avg Days",
                  "Avg Value",
                  "Translation",
                  "Apostille",
                ].map((h) => (
                  <span
                    key={h}
                    style={{
                      fontFamily: "monospace",
                      fontSize: 8,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(198,165,90,0.4)",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              {/* Rows */}
              {dna.corridors.length === 0 ? (
                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 13,
                    textAlign: "center",
                    padding: "32px 16px",
                  }}
                >
                  No completed matters yet. DNA builds as matters close.
                </p>
              ) : (
                dna.corridors.map((c, i) => (
                  <motion.div
                    key={c.corridor_key}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: EASE,
                      delay: i * 0.025,
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.4fr 1.6fr 80px 110px 80px 100px 80px 80px",
                      padding: "11px 16px",
                      borderBottom:
                        i < dna.corridors.length - 1
                          ? "1px solid rgba(255,255,255,0.03)"
                          : "none",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}
                    >
                      {c.country}
                    </span>
                    <span
                      style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}
                    >
                      {c.document_type}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 13,
                        color: "#C6A55A",
                      }}
                    >
                      {c.matter_count}
                    </span>
                    <StatusBadge status={c.status} />
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {fmtDays(c.avg_days_to_complete)}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {fmtMoney(c.avg_value)}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {fmtPct(c.translation_rate)}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      {fmtPct(c.apostille_rate)}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* ── Section 3: Two-column intelligence ───────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {/* Left: Top 5 by volume */}
            <div
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 10,
                padding: "20px 20px",
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "rgba(198,165,90,0.5)",
                  marginBottom: 18,
                }}
              >
                TOP CORRIDORS BY VOLUME
              </p>
              {top5.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
                  No data yet.
                </p>
              ) : (
                top5.map((c, i) => (
                  <div
                    key={c.corridor_key}
                    style={{
                      marginBottom: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 11,
                        width: 130,
                        flexShrink: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.country} · {c.document_type}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(c.matter_count / maxCount) * 100}%`,
                        }}
                        transition={{
                          duration: 0.4,
                          ease: EASE,
                          delay: i * 0.06,
                        }}
                        style={{
                          height: "100%",
                          background: "#C6A55A",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#C6A55A",
                        width: 24,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {c.matter_count}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Right: Lane Efficiency */}
            <div
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 10,
                padding: "20px 20px",
              }}
            >
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "rgba(198,165,90,0.5)",
                  marginBottom: 18,
                }}
              >
                LANE EFFICIENCY
              </p>
              {laneRows.map((row) => (
                <div
                  key={row.lane}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: LANE_COLOR[row.lane] ?? "rgba(255,255,255,0.3)",
                    }}
                  >
                    {row.lane}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {row.count} matters
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {fmtDays(row.avg_days)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 4: Corridor Detail Cards ─────────────────────────── */}
          {top3.length > 0 && (
            <div>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "rgba(198,165,90,0.5)",
                  marginBottom: 16,
                }}
              >
                TOP CORRIDOR PROFILES
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {top3.map((c, i) => (
                  <motion.div
                    key={c.corridor_key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: EASE,
                      delay: i * 0.1,
                    }}
                    style={{
                      background: "rgba(8,5,1,0.97)",
                      border: "1px solid rgba(212,175,55,0.08)",
                      borderRadius: 10,
                      padding: "20px",
                    }}
                  >
                    {/* Card header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.85)",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {c.country}
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: 12,
                          }}
                        >
                          {c.document_type}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>

                    {/* Stats grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      {[
                        { label: "MATTERS", value: String(c.matter_count) },
                        { label: "AVG DAYS", value: fmtDays(c.avg_days_to_complete) },
                        { label: "FASTEST", value: fmtDays(c.fastest_days) },
                        { label: "SLOWEST", value: fmtDays(c.slowest_days) },
                        { label: "AVG VALUE", value: fmtMoney(c.avg_value), span: true },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 6,
                            padding: "8px 10px",
                            gridColumn: stat.span ? "span 2" : undefined,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: 7,
                              letterSpacing: "0.28em",
                              color: "rgba(198,165,90,0.4)",
                              marginBottom: 3,
                            }}
                          >
                            {stat.label}
                          </p>
                          <p
                            style={{
                              fontFamily: "monospace",
                              fontSize: 16,
                              color: "rgba(255,255,255,0.8)",
                            }}
                          >
                            {stat.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Apostille + Translation */}
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontFamily: "monospace",
                            fontSize: 7,
                            letterSpacing: "0.28em",
                            color: "rgba(198,165,90,0.4)",
                            marginBottom: 4,
                          }}
                        >
                          APOSTILLE REQ.
                        </p>
                        <div
                          style={{
                            height: 4,
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 2,
                          }}
                        >
                          <div
                            style={{
                              width: `${c.apostille_rate}%`,
                              height: "100%",
                              background: "#C6A55A",
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <p
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            color: "rgba(255,255,255,0.45)",
                            marginTop: 3,
                          }}
                        >
                          {fmtPct(c.apostille_rate)}
                        </p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontFamily: "monospace",
                            fontSize: 7,
                            letterSpacing: "0.28em",
                            color: "rgba(198,165,90,0.4)",
                            marginBottom: 4,
                          }}
                        >
                          TRANSLATION REQ.
                        </p>
                        <div
                          style={{
                            height: 4,
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 2,
                          }}
                        >
                          <div
                            style={{
                              width: `${c.translation_rate}%`,
                              height: "100%",
                              background: "#4a9e6b",
                              borderRadius: 2,
                            }}
                          />
                        </div>
                        <p
                          style={{
                            fontFamily: "monospace",
                            fontSize: 10,
                            color: "rgba(255,255,255,0.45)",
                            marginTop: 3,
                          }}
                        >
                          {fmtPct(c.translation_rate)}
                        </p>
                      </div>
                    </div>

                    {/* Lane distribution */}
                    {Object.keys(c.lane_distribution).length > 0 && (
                      <div>
                        <p
                          style={{
                            fontFamily: "monospace",
                            fontSize: 7,
                            letterSpacing: "0.28em",
                            color: "rgba(198,165,90,0.4)",
                            marginBottom: 8,
                          }}
                        >
                          LANE DISTRIBUTION
                        </p>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {Object.entries(c.lane_distribution).map(
                            ([lane, count]) => (
                              <span
                                key={lane}
                                style={{
                                  fontFamily: "monospace",
                                  fontSize: 9,
                                  color:
                                    LANE_COLOR[lane] ?? "rgba(255,255,255,0.3)",
                                  border: `1px solid ${LANE_COLOR[lane] ?? "rgba(255,255,255,0.1)"}`,
                                  borderRadius: 3,
                                  padding: "2px 6px",
                                }}
                              >
                                {lane} {count}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
