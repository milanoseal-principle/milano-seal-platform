export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { RECEIVING_AUTHORITIES } from "@/data/authorities";

export const metadata = {
  title: "Authority Research Queue — Milano Seal",
};

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";
const RED = "#ef4444";
const AMBER = "#f59e0b";

function ConfidenceBadge({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    AUTHORITY_VERIFIED: EMERALD,
    MULTI_SOURCE_CONFIRMED: "#22c55e",
    PARTNER_CONFIRMED: GOLD,
    OBSERVED: AMBER,
    VERIFICATION_REQUIRED: RED,
    UNVERIFIED: "rgba(255,255,255,0.25)",
    DEMOTED: RED,
  };
  const labelMap: Record<string, string> = {
    AUTHORITY_VERIFIED: "Auth Verified",
    MULTI_SOURCE_CONFIRMED: "Multi-Source",
    PARTNER_CONFIRMED: "Partner Conf.",
    OBSERVED: "Observed",
    VERIFICATION_REQUIRED: "Needs Verify",
    UNVERIFIED: "Unverified",
    DEMOTED: "Demoted",
  };
  const c = colorMap[level] ?? "rgba(255,255,255,0.2)";
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "monospace",
        padding: "2px 8px",
        borderRadius: 3,
        background: `${c}22`,
        color: c,
        border: `1px solid ${c}40`,
        whiteSpace: "nowrap",
      }}
    >
      {labelMap[level] ?? level}
    </span>
  );
}

function QueueHeader({ label, count, color, priority }: { label: string; count: number; color: string; priority: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.5)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          fontFamily: "monospace",
          padding: "2px 10px",
          borderRadius: 3,
          background: `${color}22`,
          color,
          border: `1px solid ${color}40`,
        }}
      >
        {count} authorities
      </span>
      <span
        style={{
          fontSize: 10,
          fontFamily: "monospace",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {priority}
      </span>
    </div>
  );
}

function AuthTable({
  rows,
  columns,
}: {
  rows: { name: string; country: string; confidence: string; notes?: string | null; action: string }[];
  columns: string[];
}) {
  if (rows.length === 0) {
    return (
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "monospace", padding: "8px 0" }}>
        No authorities in this queue.
      </p>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            {columns.map((col) => (
              <th
                key={col}
                style={{
                  padding: "8px 12px",
                  textAlign: "left",
                  fontFamily: "monospace",
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  fontWeight: 400,
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}
            >
              <td style={{ padding: "9px 12px", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{row.name}</td>
              <td style={{ padding: "9px 12px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{row.country}</td>
              <td style={{ padding: "9px 12px" }}><ConfidenceBadge level={row.confidence} /></td>
              {columns.includes("Notes") && (
                <td style={{ padding: "9px 12px", fontSize: 11, color: "rgba(255,255,255,0.3)", maxWidth: 260 }}>
                  {row.notes ? row.notes.slice(0, 120) + (row.notes.length > 120 ? "…" : "") : "—"}
                </td>
              )}
              <td style={{ padding: "9px 12px", fontSize: 11, color: GOLD, fontFamily: "monospace" }}>{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AuthorityResearchPage() {
  await requireDashboardAccess();

  const active = RECEIVING_AUTHORITIES.filter((a) => a.valid_to === null);

  const needsResearch = active
    .filter((a) => ["UNVERIFIED", "VERIFICATION_REQUIRED"].includes(a.authority_confidence))
    .sort((a, b) => a.country_name.localeCompare(b.country_name))
    .slice(0, 20);

  const observed = active.filter((a) => a.authority_confidence === "OBSERVED");
  const partnerConfirmed = active.filter((a) => a.authority_confidence === "PARTNER_CONFIRMED");
  const fullyVerified = active.filter((a) =>
    ["MULTI_SOURCE_CONFIRMED", "AUTHORITY_VERIFIED"].includes(a.authority_confidence),
  );

  const needsResearchRows = needsResearch.map((a) => ({
    name: a.authority_name,
    country: a.country_name,
    confidence: a.authority_confidence,
    action: "Research authority → update confidence",
  }));

  const observedRows = observed.map((a) => ({
    name: a.authority_name,
    country: a.country_name,
    confidence: a.authority_confidence,
    notes: a.notes_operator,
    action: "Obtain partner confirmation",
  }));

  const partnerRows = partnerConfirmed.map((a) => ({
    name: a.authority_name,
    country: a.country_name,
    confidence: a.authority_confidence,
    notes: a.notes_operator,
    action: "Obtain second independent source",
  }));

  return (
    <div
      style={{
        background: "#0A0A0A",
        minHeight: "100vh",
        padding: "32px 24px",
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
          Intelligence · Authority Moat
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>
          Authority Research Queue
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, maxWidth: 560 }}>
          Work queues for promoting authority confidence. Research is operator-conducted — no automated promotion.
        </p>
      </div>

      {/* Operator note */}
      <div
        style={{
          background: "rgba(198,165,90,0.06)",
          border: "1px solid rgba(198,165,90,0.15)",
          borderRadius: 6,
          padding: "12px 16px",
          marginBottom: 28,
          fontSize: 12,
          color: "rgba(198,165,90,0.7)",
          fontFamily: "monospace",
        }}
      >
        ↯ This queue updates as confidence levels are promoted in the Authority Operations Center. Research is operator-conducted — no automated promotion.
      </div>

      {/* Queue 4 — Verified (count only) */}
      <div
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "rgba(198,165,90,0.5)",
            }}
          >
            Queue 4 — Verified
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              padding: "2px 10px",
              borderRadius: 3,
              background: `${EMERALD}22`,
              color: EMERALD,
              border: `1px solid ${EMERALD}40`,
            }}
          >
            {fullyVerified.length} authorities
          </span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 10, marginBottom: 0 }}>
          <span style={{ color: EMERALD, fontWeight: 600 }}>{fullyVerified.length}</span> authorities fully verified (Multi-Source Confirmed + Authority Verified). These are the moat.
        </p>
      </div>

      {/* Queue 1 — Needs Research */}
      <div
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <QueueHeader label="Queue 1 — Needs Research" count={needsResearch.length} color={RED} priority="CRITICAL PRIORITY" />
        <AuthTable
          rows={needsResearchRows}
          columns={["Authority Name", "Country", "Current Status", "Priority Action"]}
        />
      </div>

      {/* Queue 2 — Promote to Partner Confirmed */}
      <div
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <QueueHeader label="Queue 2 — Promote to Partner Confirmed" count={observed.length} color={AMBER} priority="HIGH PRIORITY" />
        <AuthTable
          rows={observedRows}
          columns={["Authority Name", "Country", "Current Status", "Notes", "Action Needed"]}
        />
      </div>

      {/* Queue 3 — Promote to Multi-Source */}
      <div
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
          borderRadius: 8,
          padding: "20px 24px",
          marginBottom: 20,
        }}
      >
        <QueueHeader label="Queue 3 — Promote to Multi-Source" count={partnerConfirmed.length} color={GOLD} priority="MEDIUM PRIORITY" />
        <AuthTable
          rows={partnerRows}
          columns={["Authority Name", "Country", "Current Status", "Notes", "Action Needed"]}
        />
      </div>
    </div>
  );
}
