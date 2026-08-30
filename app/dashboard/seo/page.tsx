export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { SearchConsoleSyncControl } from "@/components/dashboard/SearchConsoleSyncControl";

export const metadata = {
  title: "SEO Operations — Milano Seal",
};

const COUNTRIES = [
  "Italy", "Mexico", "Germany", "Spain", "France", "Brazil", "Portugal",
  "China", "Japan", "UAE", "Colombia", "Peru", "Argentina", "Philippines",
  "India", "South Korea", "Canada", "UK", "Australia", "Dominican Republic",
];

const DOCUMENT_TYPES = [
  "Birth Certificate", "Marriage Certificate", "Diploma", "Power of Attorney",
  "Death Certificate", "Divorce Decree", "Criminal Background Check",
  "Articles of Incorporation", "Medical Records", "Notarized Affidavit",
];

const AUTHORITY_PAGES = [
  { country: "Italy", authority: "Prefettura di Roma" },
  { country: "Mexico", authority: "SRE (Secretaría de Relaciones Exteriores)" },
  { country: "Germany", authority: "Kultusministerkonferenz" },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default async function SEOPage() {
  await requireDashboardAccess();

  const totalTarget = COUNTRIES.length + DOCUMENT_TYPES.length + AUTHORITY_PAGES.length;

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
    padding: "10px 16px",
    fontSize: 12,
    fontFamily: "monospace",
    borderBottom: "1px solid rgba(212,175,55,0.04)",
  };

  const PlannedBadge = () => (
    <span style={{
      fontSize: 10,
      fontFamily: "monospace",
      color: "#f59e0b",
      background: "rgba(245,158,11,0.08)",
      border: "1px solid rgba(245,158,11,0.2)",
      borderRadius: 4,
      padding: "2px 8px",
    }}>
      Planned
    </span>
  );

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / SEO OPERATIONS CENTER
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          SEO Operations Center
        </h1>

        <SearchConsoleSyncControl />

        {/* Counts */}
        <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
          {[
            { label: "Total Target Pages", value: String(totalTarget) },
            { label: "Planned", value: String(totalTarget) },
            { label: "Built", value: "0" },
            { label: "Indexed", value: "0" },
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
              <p style={{ fontSize: 24, fontWeight: 700, color: "#C6A55A", margin: 0, fontFamily: "monospace" }}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Country Pages */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          COUNTRY PAGES ({COUNTRIES.length})
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Country", "Slug", "Status"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {COUNTRIES.map((c) => (
                  <tr key={c}>
                    <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{c}</td>
                    <td style={{ ...tdBase, color: "rgba(255,255,255,0.4)" }}>/apostille/{slugify(c)}</td>
                    <td style={{ ...tdBase }}><PlannedBadge /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Pages */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          DOCUMENT TYPE PAGES ({DOCUMENT_TYPES.length})
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Document Type", "Slug", "Status"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {DOCUMENT_TYPES.map((d) => (
                  <tr key={d}>
                    <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{d}</td>
                    <td style={{ ...tdBase, color: "rgba(255,255,255,0.4)" }}>/apostille/documents/{slugify(d)}</td>
                    <td style={{ ...tdBase }}><PlannedBadge /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Authority Pages */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          AUTHORITY PAGES ({AUTHORITY_PAGES.length})
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Country", "Authority", "Status"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {AUTHORITY_PAGES.map((a) => (
                <tr key={a.country}>
                  <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{a.country}</td>
                  <td style={{ ...tdBase, color: "rgba(255,255,255,0.6)" }}>{a.authority}</td>
                  <td style={{ ...tdBase }}><PlannedBadge /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          SEO pages are generated from the country and document intelligence registry. Build requires operator approval per page.
        </p>
      </div>
    </div>
  );
}
