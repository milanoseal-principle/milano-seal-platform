import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  RECEIVING_AUTHORITIES,
  getVerificationQueue,
  getReviewQueue,
  getPromotionQueue,
  getDemotedAuthorities,
  getAuthorityCoverage,
} from "@/data/authorities";
import { AuthorityCoverageMap } from "@/components/dashboard/aoc/AuthorityCoverageMap";
import { VerificationQueue } from "@/components/dashboard/aoc/VerificationQueue";
import { ReviewQueue } from "@/components/dashboard/aoc/ReviewQueue";
import { PromotionQueue } from "@/components/dashboard/aoc/PromotionQueue";
import { AuthorityAlertSystem } from "@/components/dashboard/AuthorityAlertSystem";
import { ChainCertificationPanel } from "@/components/dashboard/aoc/ChainCertificationPanel";
import { IntelligenceScorePanel } from "@/components/dashboard/aoc/IntelligenceScorePanel";
import {
  getCountryChainReport,
  getAllAuthorityIntelligenceScores,
} from "@/lib/authorityChainCertification";

const GOLD = "#C6A55A";
const RED = "#e05252";

export const metadata = {
  title: "Authority Operations Center — Milano Seal",
};

export default async function AuthorityOperationsCenterPage() {
  await requireDashboardAccess();

  const verificationQueue = getVerificationQueue();
  const reviewQueue = getReviewQueue();
  const promotionQueue = getPromotionQueue();
  const demoted = getDemotedAuthorities();
  const coverage = getAuthorityCoverage();
  const allAuthorities = RECEIVING_AUTHORITIES.filter((a) => a.valid_to === null);

  const verifiedCount = allAuthorities.filter(
    (a) =>
      a.authority_confidence === "AUTHORITY_VERIFIED" ||
      a.authority_confidence === "MULTI_SOURCE_CONFIRMED",
  ).length;

  const chainResults = [
    ...getCountryChainReport("IT"),
    ...getCountryChainReport("PT"),
    ...getCountryChainReport("MX"),
  ];

  const intelligenceScores = getAllAuthorityIntelligenceScores();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        padding: "32px 40px",
        color: "rgba(255,255,255,0.75)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            color: "rgba(198,165,90,0.5)",
            marginBottom: 8,
          }}
        >
          Milano Seal — Internal
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            margin: 0,
            marginBottom: 6,
            letterSpacing: "-0.01em",
          }}
        >
          Authority Operations Center
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
          Internal operator workspace. Not accessible to portal or alliance.
        </p>
      </div>

      {/* Row 1 — Stat chips */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Total Authorities", value: allAuthorities.length, color: "rgba(255,255,255,0.75)" },
          { label: "Verified", value: verifiedCount, color: "#4a9e6b" },
          { label: "Review Due", value: reviewQueue.length, color: reviewQueue.length > 0 ? RED : "rgba(255,255,255,0.4)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "rgba(8,5,1,0.97)",
              border: "1px solid rgba(212,175,55,0.08)",
              borderRadius: 2,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontFamily: "monospace",
                color: "rgba(198,165,90,0.5)",
                marginBottom: 8,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "monospace" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Row 2 — Coverage map */}
      <div style={{ marginBottom: 20 }}>
        <AuthorityCoverageMap coverage={coverage} />
      </div>

      {/* Row 3 — Verification + Review queues */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <VerificationQueue authorities={verificationQueue} />
        <ReviewQueue authorities={reviewQueue} />
      </div>

      {/* Row 4 — Promotion queue + Alerts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <PromotionQueue authorities={promotionQueue} />
        <AuthorityAlertSystem />
      </div>

      {/* Row 5 — Chain Certification */}
      <div style={{ marginBottom: 20 }}>
        <ChainCertificationPanel results={chainResults} />
      </div>

      {/* Row 6 — Intelligence Scores */}
      <div style={{ marginBottom: 20 }}>
        <IntelligenceScorePanel scores={intelligenceScores} />
      </div>

      {/* Row 7 — Demoted authorities */}
      {demoted.length > 0 && (
        <div
          style={{
            background: "rgba(8,5,1,0.97)",
            border: `1px solid ${RED}22`,
            borderRadius: 2,
            padding: "20px 24px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: `${RED}80`,
              marginBottom: 16,
            }}
          >
            Demoted — {demoted.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {demoted.map((a, i) => (
              <div
                key={a.id}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    i < demoted.length - 1
                      ? "1px solid rgba(255,255,255,0.04)"
                      : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 3 }}>
                      {a.authority_name}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                      {a.country_name}
                    </div>
                    {a.notes_operator && (
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, lineHeight: 1.4 }}>
                        {a.notes_operator.slice(0, 120)}
                        {a.notes_operator.length > 120 ? "…" : ""}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: RED,
                      background: `${RED}10`,
                      padding: "2px 8px",
                      borderRadius: 2,
                      border: `1px solid ${RED}30`,
                      flexShrink: 0,
                    }}
                  >
                    Demoted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footnote */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.04)",
          paddingTop: 16,
          fontSize: 10,
          color: "rgba(255,255,255,0.2)",
          fontFamily: "monospace",
          letterSpacing: "0.06em",
        }}
      >
        All authority data is operator-only. Source vault entries are never exposed to portal or alliance clients.
      </div>
    </div>
  );
}
