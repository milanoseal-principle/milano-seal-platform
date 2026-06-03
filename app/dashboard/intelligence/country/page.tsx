export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { COUNTRY_PROFILES } from "@/data/intelligence/countryProfiles";
import { CountryHeatmap } from "@/components/dashboard/CountryHeatmap";

const HAGUE_LABELS: Record<string, string> = {
  hague: "Hague",
  non_hague: "Non-Hague",
  hague_with_caveats: "Hague (Caveats)",
  verification_required: "Verification Required",
};

const SOURCE_LABELS: Record<string, string> = {
  verified: "Verified",
  observed: "Observed",
  placeholder: "Placeholder",
  needs_review: "Needs Review",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default async function CountryIntelligencePage() {
  await requireDashboardAccess();

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Operator notice */}
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "6px",
          padding: "0.75rem 1rem",
          marginBottom: "1.5rem",
          fontSize: "0.8rem",
          color: "#aaa",
        }}
      >
        <strong style={{ color: "#d4a853" }}>Operator Note:</strong> This
        profile enriches routing context only. Verified authority records remain
        controlling. Source status reflects the confidence level of the
        underlying data — placeholder and observed entries should not be used as
        authoritative references.
      </div>

      <h1
        style={{
          fontSize: "1.4rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
          color: "#fff",
        }}
      >
        Country Intelligence Registry
      </h1>
      <p
        style={{
          fontSize: "0.85rem",
          color: "#888",
          marginBottom: "1.5rem",
        }}
      >
        {COUNTRY_PROFILES.length} country profiles · Display enrichment only
      </p>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.8rem",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid #333",
                color: "#888",
                textAlign: "left",
              }}
            >
              <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>
                Country
              </th>
              <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>
                Region
              </th>
              <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>
                Primary Languages
              </th>
              <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>
                Hague Status
              </th>
              <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>
                Translation Default
              </th>
              <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>
                Alliance Priority
              </th>
              <th style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>
                Source Status
              </th>
            </tr>
          </thead>
          <tbody>
            {COUNTRY_PROFILES.map((profile) => (
              <tr
                key={profile.country_slug}
                style={{
                  borderBottom: "1px solid #222",
                  color: "#ddd",
                }}
              >
                <td
                  style={{
                    padding: "0.5rem 0.75rem",
                    color: "#fff",
                    fontWeight: 500,
                  }}
                >
                  {profile.country_name}
                </td>
                <td style={{ padding: "0.5rem 0.75rem", color: "#aaa" }}>
                  {profile.region}
                </td>
                <td style={{ padding: "0.5rem 0.75rem", color: "#aaa" }}>
                  {profile.primary_languages.join(", ")}
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      background:
                        profile.hague_status === "hague"
                          ? "#1a3a1a"
                          : profile.hague_status === "non_hague"
                            ? "#3a1a1a"
                            : profile.hague_status === "hague_with_caveats"
                              ? "#2a2a1a"
                              : "#2a1a2a",
                      color:
                        profile.hague_status === "hague"
                          ? "#6fcf6f"
                          : profile.hague_status === "non_hague"
                            ? "#cf6f6f"
                            : profile.hague_status === "hague_with_caveats"
                              ? "#cfcf6f"
                              : "#cf9fcf",
                    }}
                  >
                    {HAGUE_LABELS[profile.hague_status] ?? profile.hague_status}
                  </span>
                </td>
                <td style={{ padding: "0.5rem 0.75rem", color: "#aaa" }}>
                  {profile.translation_required_default ? "Recommended" : "Not default"}
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      background:
                        profile.alliance_priority === "high"
                          ? "#1a2a3a"
                          : profile.alliance_priority === "medium"
                            ? "#1a2a1a"
                            : "#222",
                      color:
                        profile.alliance_priority === "high"
                          ? "#6fafcf"
                          : profile.alliance_priority === "medium"
                            ? "#6faf8f"
                            : "#888",
                    }}
                  >
                    {PRIORITY_LABELS[profile.alliance_priority]}
                  </span>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.72rem",
                      background:
                        profile.source_status === "verified"
                          ? "#1a3a1a"
                          : profile.source_status === "observed"
                            ? "#2a2a1a"
                            : profile.source_status === "needs_review"
                              ? "#3a1a1a"
                              : "#222",
                      color:
                        profile.source_status === "verified"
                          ? "#6fcf6f"
                          : profile.source_status === "observed"
                            ? "#cfcf6f"
                            : profile.source_status === "needs_review"
                              ? "#cf6f6f"
                              : "#888",
                    }}
                  >
                    {SOURCE_LABELS[profile.source_status] ?? profile.source_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Country Heatmap */}
      <div style={{ marginTop: "2rem" }}>
        <CountryHeatmap />
      </div>
    </div>
  );
}
