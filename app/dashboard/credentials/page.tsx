export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const metadata = {
  title: "Credentials Center — Milano Seal",
};

const CREDENTIALS = [
  {
    name: "Florida Notary Commission",
    status: "Active",
    expiry: "OPERATOR ENTER DATE",
    renewal: "90 days before expiry",
    notes: "OPERATOR UPDATE REQUIRED",
  },
  {
    name: "Remote Online Notary (RON) Authorization",
    status: "Active",
    expiry: "OPERATOR ENTER DATE",
    renewal: "Per platform terms",
    notes: "OPERATOR UPDATE REQUIRED",
  },
  {
    name: "E&O Insurance",
    status: "OPERATOR VERIFY",
    expiry: "OPERATOR ENTER DATE",
    renewal: "90 days before expiry",
    notes: "OPERATOR UPDATE REQUIRED",
  },
  {
    name: "Business License",
    status: "Active",
    expiry: "OPERATOR ENTER DATE",
    renewal: "Per state requirements",
    notes: "OPERATOR UPDATE REQUIRED",
  },
  {
    name: "IATA/Transport Compliance",
    status: "Not Applicable",
    expiry: "—",
    renewal: "—",
    notes: "N/A for apostille services",
  },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  Active: { color: "#4a9e6b", bg: "rgba(74,158,107,0.08)", border: "rgba(74,158,107,0.3)" },
  "OPERATOR VERIFY": { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
  "Not Applicable": { color: "rgba(255,255,255,0.35)", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)" },
};

export default async function CredentialsPage() {
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
    padding: "12px 16px",
    fontSize: 12,
    fontFamily: "monospace",
    borderBottom: "1px solid rgba(212,175,55,0.04)",
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Operator banner */}
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 6,
            padding: "12px 20px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>
            OPERATOR ONLY
          </span>
          <span style={{ fontSize: 12, color: "rgba(239,68,68,0.85)" }}>
            Credential records are never shared with clients, partners, or alliance members.
          </span>
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / CREDENTIALS CENTER
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Credentials Center
        </h1>

        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Credential", "Status", "Expiry", "Renewal Schedule", "Notes"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CREDENTIALS.map((c) => {
                  const ss = STATUS_STYLE[c.status] ?? STATUS_STYLE["OPERATOR VERIFY"];
                  return (
                    <tr key={c.name}>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{c.name}</td>
                      <td style={{ ...tdBase }}>
                        <span style={{
                          fontSize: 10,
                          color: ss.color,
                          background: ss.bg,
                          border: `1px solid ${ss.border}`,
                          borderRadius: 4,
                          padding: "2px 8px",
                        }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.45)" }}>{c.expiry}</td>
                      <td style={{ ...tdBase, color: "rgba(255,255,255,0.35)" }}>{c.renewal}</td>
                      <td style={{ ...tdBase, color: "#f59e0b", fontSize: 11 }}>{c.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Renewal alerts are sent 90 days before expiry. Verify dates with operator.
        </p>
      </div>
    </div>
  );
}
