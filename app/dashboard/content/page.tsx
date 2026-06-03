"use client";

const CONTENT_QUEUE = [
  // Draft
  { title: "Italy Apostille Guide", type: "Guide", targetCountry: "Italy", status: "Draft", wordCount: "~2,000" },
  { title: "Mexico Apostille 2024 Update", type: "Guide", targetCountry: "Mexico", status: "Draft", wordCount: "~1,500" },
  { title: "Power of Attorney Apostille Checklist", type: "Guide", targetCountry: "All", status: "Draft", wordCount: "~800" },
  { title: "Apostille for Dual Citizens", type: "FAQ", targetCountry: "All", status: "Draft", wordCount: "~1,200" },
  { title: "Embassy vs Apostille Explained", type: "FAQ", targetCountry: "All", status: "Draft", wordCount: "~900" },
  // In Review
  { title: "What Documents Need Apostille", type: "FAQ", targetCountry: "All", status: "In Review", wordCount: "~1,100" },
  { title: "US Birth Certificate for Foreign Use", type: "Guide", targetCountry: "All", status: "In Review", wordCount: "~1,400" },
  { title: "Marriage Certificate for Immigration", type: "Guide", targetCountry: "All", status: "In Review", wordCount: "~1,300" },
  // Approved
  { title: "Apostille Process Overview", type: "Landing", targetCountry: "All", status: "Approved", wordCount: "~1,800" },
  { title: "Florida Notary Services Guide", type: "Guide", targetCountry: "USA", status: "Approved", wordCount: "~2,200" },
];

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Draft: { color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" },
  "In Review": { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  Approved: { color: "#4a9e6b", bg: "rgba(74,158,107,0.08)", border: "rgba(74,158,107,0.3)" },
};

const TYPE_COLORS: Record<string, string> = {
  Guide: "#C6A55A",
  FAQ: "rgba(255,255,255,0.6)",
  Landing: "#4a9e6b",
};

export default function ContentPage() {
  const draftCount = CONTENT_QUEUE.filter((c) => c.status === "Draft").length;
  const reviewCount = CONTENT_QUEUE.filter((c) => c.status === "In Review").length;
  const approvedCount = CONTENT_QUEUE.filter((c) => c.status === "Approved").length;

  const thStyle: React.CSSProperties = {
    padding: "10px 16px",
    textAlign: "left",
    fontFamily: "monospace",
    fontSize: 9,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: "rgba(198,165,90,0.5)",
    borderBottom: "1px solid rgba(212,175,55,0.06)",
    fontWeight: 400,
  };

  const tdBase: React.CSSProperties = {
    padding: "11px 16px",
    fontSize: 12,
    fontFamily: "monospace",
    borderBottom: "1px solid rgba(212,175,55,0.04)",
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / CONTENT OPERATIONS
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Content Operations
        </h1>

        {/* Status counts */}
        <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
          {[
            { label: "Draft", value: draftCount, color: "rgba(255,255,255,0.5)" },
            { label: "In Review", value: reviewCount, color: "#f59e0b" },
            { label: "Approved", value: approvedCount, color: "#4a9e6b" },
            { label: "Total Pieces", value: CONTENT_QUEUE.length, color: "#C6A55A" },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                flex: 1,
                minWidth: 140,
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 8px" }}>
                {c.label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: c.color, margin: 0, fontFamily: "monospace" }}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Queue table */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          CONTENT PRODUCTION QUEUE
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title", "Type", "Target", "Word Count", "Status"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTENT_QUEUE.map((item) => {
                const ss = STATUS_STYLES[item.status];
                return (
                  <tr key={item.title}>
                    <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{item.title}</td>
                    <td style={{ ...tdBase, color: TYPE_COLORS[item.type] ?? "rgba(255,255,255,0.5)" }}>{item.type}</td>
                    <td style={{ ...tdBase, color: "rgba(255,255,255,0.4)" }}>{item.targetCountry}</td>
                    <td style={{ ...tdBase, color: "rgba(255,255,255,0.35)" }}>{item.wordCount}</td>
                    <td style={{ ...tdBase }}>
                      <span style={{
                        fontSize: 10,
                        color: ss.color,
                        background: ss.bg,
                        border: `1px solid ${ss.border}`,
                        borderRadius: 4,
                        padding: "2px 8px",
                      }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Content queue is operator-managed. No auto-publish. Each piece requires founder approval before deployment.
        </p>
      </div>
    </div>
  );
}
