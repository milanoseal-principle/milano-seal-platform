export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const metadata = {
  title: "Legal Operations — Milano Seal",
};

const LEGAL_DOCS = [
  { name: "Terms of Service", status: "Active", lastUpdated: "[DATE — OPERATOR UPDATE]", cycle: "Annual", required: "Yes" },
  { name: "Privacy Policy", status: "Active", lastUpdated: "[DATE — OPERATOR UPDATE]", cycle: "Annual", required: "Yes" },
  { name: "Apostille Disclaimer", status: "Active", lastUpdated: "[DATE — OPERATOR UPDATE]", cycle: "As needed", required: "Yes" },
  { name: "No Guarantee Disclosure", status: "Active", lastUpdated: "[DATE — OPERATOR UPDATE]", cycle: "As needed", required: "Yes — on all quotes" },
  { name: "Partner Agreement Template", status: "Draft", lastUpdated: "[DATE — OPERATOR UPDATE]", cycle: "Per alliance partner", required: "Per partner" },
  { name: "Vendor Agreement Template", status: "Active", lastUpdated: "[DATE — OPERATOR UPDATE]", cycle: "Annual", required: "Per vendor" },
  { name: "Notary Bond", status: "Active", lastUpdated: "[DATE — OPERATOR UPDATE]", cycle: "Per bond term", required: "Yes" },
  { name: "RON Platform Agreement", status: "Active", lastUpdated: "[DATE — OPERATOR UPDATE]", cycle: "Annual", required: "Platform: [OPERATOR ENTER]" },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  Active: { color: "#4a9e6b", bg: "rgba(74,158,107,0.08)", border: "rgba(74,158,107,0.3)" },
  Draft: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
};

const DISCLOSURES = [
  {
    title: "No Guarantee Disclosure",
    text: "Milano Seal coordinates document execution and apostille services. Acceptance of apostilled documents by foreign authorities is determined solely by those authorities and cannot be guaranteed.",
  },
  {
    title: "Authority Disclaimer",
    text: "Authority information is provided for routing enrichment only. Operators must verify current requirements with official government sources before submission.",
  },
  {
    title: "RON Disclosure",
    text: "Remote Online Notarization performed pursuant to Florida Statutes. Notary commission verified with the Florida Department of State.",
  },
];

export default async function LegalPage() {
  await requireDashboardAccess();

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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / LEGAL OPERATIONS
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Legal Operations
        </h1>

        {/* Document tracker */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          LEGAL DOCUMENT TRACKER
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 32 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Document", "Status", "Last Updated", "Review Cycle", "Required"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEGAL_DOCS.map((doc) => {
                  const ss = STATUS_STYLE[doc.status] ?? STATUS_STYLE["Draft"];
                  return (
                    <tr key={doc.name}>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{doc.name}</td>
                      <td style={{ ...tdBase }}>
                        <span style={{
                          fontSize: 10,
                          color: ss.color,
                          background: ss.bg,
                          border: `1px solid ${ss.border}`,
                          borderRadius: 4,
                          padding: "2px 8px",
                        }}>
                          {doc.status}
                        </span>
                      </td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.4)" }}>{doc.lastUpdated}</td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.4)" }}>{doc.cycle}</td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.5)" }}>{doc.required}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclosure text blocks */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
          STANDARD DISCLOSURE TEXTS
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {DISCLOSURES.map((d) => (
            <div
              key={d.title}
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "20px 24px",
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
                {d.title}
              </p>
              <p style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.75)",
                margin: 0,
                lineHeight: 1.7,
                fontFamily: "Georgia, serif",
                fontStyle: "italic",
              }}>
                {d.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
