"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { RejectedMatter, TerminalEvent } from "@/app/dashboard/memory/page";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const EASE = [0.22, 1, 0.36, 1] as const;

type Category = "All" | "Rejections" | "Authority Changes" | "Release Issues" | "Payment Issues" | "Corrections";

const CATEGORIES: Category[] = [
  "All",
  "Rejections",
  "Authority Changes",
  "Release Issues",
  "Payment Issues",
  "Corrections",
];

interface IncidentRow {
  id: string;
  date: string;
  country: string;
  document: string;
  type: string;
  summary: string;
  status: "Open" | "Resolved" | "Monitoring";
  rawNotes?: string | null;
  rawMeta?: Record<string, unknown> | null;
}

function getEventType(et: string): string {
  switch (et) {
    case "REJECTION_LOGGED": return "Rejection";
    case "AUTHORITY_DEMOTED": return "Authority Changes";
    case "CORRECTION_APPLIED": return "Corrections";
    case "RELEASE_FAILED": return "Release Issues";
    case "PAYMENT_FAILED": return "Payment Issues";
    default: return "Other";
  }
}

function typeBadgeColor(type: string): string {
  if (type.toLowerCase().includes("reject")) return RED;
  if (type.toLowerCase().includes("authority")) return AMBER;
  if (type.toLowerCase().includes("release")) return GOLD;
  if (type.toLowerCase().includes("payment")) return AMBER;
  if (type.toLowerCase().includes("correction")) return EMERALD;
  return "rgba(255,255,255,0.3)";
}

function matchesCategory(row: IncidentRow, cat: Category): boolean {
  if (cat === "All") return true;
  const t = row.type.toLowerCase();
  switch (cat) {
    case "Rejections": return t.includes("reject");
    case "Authority Changes": return t.includes("authority");
    case "Release Issues": return t.includes("release");
    case "Payment Issues": return t.includes("payment");
    case "Corrections": return t.includes("correction");
    default: return true;
  }
}

function matchesSearch(row: IncidentRow, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    (row.country || "").toLowerCase().includes(lower) ||
    (row.document || "").toLowerCase().includes(lower) ||
    (row.type || "").toLowerCase().includes(lower) ||
    (row.summary || "").toLowerCase().includes(lower)
  );
}

function buildRows(
  incidents: RejectedMatter[],
  events: TerminalEvent[]
): IncidentRow[] {
  const rows: IncidentRow[] = [];

  for (const inc of incidents) {
    const summary = (inc.notes || "").slice(0, 60) || "No notes recorded.";
    rows.push({
      id: inc.id,
      date: inc.created_at,
      country: inc.destination_country || "—",
      document: inc.document_type || "—",
      type: inc.matter_status === "rejected" ? "Rejection" : "Issue",
      summary,
      status: inc.matter_status === "rejected" ? "Open" : "Monitoring",
      rawNotes: inc.notes,
    });
  }

  for (const evt of events) {
    const metaSummary = evt.metadata
      ? Object.entries(evt.metadata)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
          .slice(0, 60)
      : "No metadata.";
    rows.push({
      id: `${evt.event_type}-${evt.created_at}`,
      date: evt.created_at,
      country: (evt.metadata?.country as string) || "—",
      document: (evt.metadata?.document_type as string) || "—",
      type: getEventType(evt.event_type),
      summary: metaSummary,
      status: evt.event_type === "CORRECTION_APPLIED" ? "Resolved" : "Open",
      rawMeta: evt.metadata,
    });
  }

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return rows;
}

const KNOWN_PATTERNS = [
  {
    title: "Italy — Codice Fiscale",
    text: "Italian apostilles may require matching Codice Fiscale. Verify before submission to Prefettura.",
    category: "Authority",
    severity: "High" as const,
  },
  {
    title: "Mexico — SRE Timeline",
    text: "SRE processing in Mexico City can take 3–15 business days depending on workload. Build timeline buffer.",
    category: "Corridor",
    severity: "Medium" as const,
  },
  {
    title: "Translation Requirement",
    text: "Apostilled documents for official use in non-English countries typically require certified translation even when not explicitly stated by the receiving authority.",
    category: "Execution",
    severity: "High" as const,
  },
  {
    title: "Apostille Stamp Age",
    text: "Some receiving authorities require apostille stamps issued within 6 months. Verify receiving authority requirements before submission.",
    category: "Authority",
    severity: "High" as const,
  },
  {
    title: "China 2023 Hague Accession",
    text: "China joined the Hague Apostille Convention in 2023 but implementation varies by province and document type. Verify current requirements directly.",
    category: "Corridor",
    severity: "Critical" as const,
  },
];

function severityColor(s: "Critical" | "High" | "Medium" | "Low"): string {
  switch (s) {
    case "Critical": return RED;
    case "High": return AMBER;
    case "Medium": return GOLD;
    default: return "rgba(255,255,255,0.3)";
  }
}

function ExpandedRow({ row }: { row: IncidentRow }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{ overflow: "hidden" }}
    >
      <div
        style={{
          padding: "16px 24px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.7,
            fontFamily: "monospace",
          }}
        >
          {row.rawNotes ||
            (row.rawMeta
              ? JSON.stringify(row.rawMeta, null, 2)
              : "No additional detail.")}
        </p>
      </div>
    </motion.div>
  );
}

export function InstitutionalMemory({
  incidents,
  events,
}: {
  incidents: RejectedMatter[];
  events: TerminalEvent[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const rows = useMemo(() => buildRows(incidents, events), [incidents, events]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => matchesCategory(r, category) && matchesSearch(r, search)
      ),
    [rows, search, category]
  );

  const rejectionCount = rows.filter((r) => r.type === "Rejection").length;
  const authorityCount = rows.filter((r) => r.type === "Authority Changes").length;
  const resolvedCount = rows.filter((r) => r.status === "Resolved").length;
  const isEmpty = rows.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        padding: "32px 24px",
        maxWidth: 1200,
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
          Institutional Memory Engine
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 4,
          }}
        >
          The Damiani Engine
        </h1>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.28)",
            fontStyle: "italic",
            marginBottom: 12,
          }}
        >
          Every mistake becomes institutional knowledge. Every correction becomes a rule. Every incident builds the moat.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by country, document, authority, error type..."
          style={{
            width: "100%",
            background: "rgba(8,5,1,0.97)",
            border: `1px solid ${search ? GOLD : "rgba(212,175,55,0.12)"}`,
            borderRadius: 6,
            padding: "10px 16px",
            color: "rgba(255,255,255,0.8)",
            fontSize: 13,
            fontFamily: "monospace",
            outline: "none",
            transition: "border-color 200ms",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Category chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: "4px 12px",
              borderRadius: 4,
              border: `1px solid ${category === cat ? GOLD : "rgba(255,255,255,0.1)"}`,
              background: "transparent",
              color: category === cat ? GOLD : "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats chips */}
      {!isEmpty && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { label: "Total Incidents", value: rows.length },
            { label: "Rejections", value: rejectionCount },
            { label: "Authority Events", value: authorityCount },
            { label: "Resolutions", value: resolvedCount },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "6px 14px",
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 4,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  color: "rgba(198,165,90,0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  marginRight: 8,
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            padding: "48px 32px",
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.08)",
            borderRadius: 8,
            marginBottom: 32,
          }}
        >
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
            Memory Accumulation Pending
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 16 }}>
            The Institutional Memory Engine captures incidents as they occur.
            Search history will appear here as:
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {[
              "Rejections are logged",
              "Authority changes are recorded",
              "Corrections are documented",
              "Release issues are tracked",
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "monospace",
                  padding: "3px 0",
                }}
              >
                • {item}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
            Every incident logged here prevents future recurrence.
          </p>
        </motion.div>
      ) : (
        /* Incident log table */
        <div
          style={{
            background: "rgba(8,5,1,0.97)",
            border: "1px solid rgba(212,175,55,0.08)",
            borderRadius: 8,
            marginBottom: 32,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 1fr 120px 1fr 90px",
              gap: 16,
              padding: "10px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {["Date", "Country", "Document", "Type", "Summary", "Status"].map((h) => (
              <span
                key={h}
                style={{
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(198,165,90,0.4)",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center" }}>
              <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                No results match current filters.
              </p>
            </div>
          ) : (
            filtered.map((row, i) => (
              <div key={row.id}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  onClick={() =>
                    setExpandedId(expandedId === row.id ? null : row.id)
                  }
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 1fr 120px 1fr 90px",
                    gap: 16,
                    padding: "12px 20px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    transition: "background 150ms",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {new Date(row.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                    {row.country}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {row.document}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 9,
                        letterSpacing: "0.1em",
                        padding: "2px 7px",
                        borderRadius: 3,
                        border: `1px solid ${typeBadgeColor(row.type)}`,
                        color: typeBadgeColor(row.type),
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {row.type}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.4)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.summary}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 9,
                      color:
                        row.status === "Resolved"
                          ? EMERALD
                          : row.status === "Monitoring"
                          ? AMBER
                          : "rgba(255,255,255,0.4)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {row.status}
                  </span>
                </motion.div>
                <AnimatePresence>
                  {expandedId === row.id && <ExpandedRow row={row} />}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      )}

      {/* Known Patterns section */}
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
          Known Patterns
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {KNOWN_PATTERNS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.28, ease: EASE }}
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderLeft: `3px solid ${severityColor(p.severity)}`,
                borderRadius: 6,
                padding: "14px 18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {p.title}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    padding: "1px 6px",
                    borderRadius: 3,
                    border: `1px solid rgba(255,255,255,0.1)`,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {p.category}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: severityColor(p.severity),
                  }}
                >
                  {p.severity}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                {p.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
