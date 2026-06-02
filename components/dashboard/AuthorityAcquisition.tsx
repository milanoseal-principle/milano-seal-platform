"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { TrendingUp, CheckCircle2, Eye, AlertTriangle, ArrowRight } from "lucide-react";
import type { CountryStat, GlobalStats, ConfidenceCounts } from "@/app/dashboard/authority-acquisition/page";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const EASE = [0.22, 1, 0.36, 1] as const;

const TIER1_COUNTRIES = new Set(["Italy", "Portugal", "Mexico", "Spain", "Germany", "France", "Greece", "Brazil", "United Kingdom", "Canada"]);

const PRIORITY_TARGETS = [
  { name: "Comune di Cansano", country: "Italy", current: "OBSERVED", target: "PARTNER_CONFIRMED" },
  { name: "Comune di Roma", country: "Italy", current: "OBSERVED", target: "PARTNER_CONFIRMED" },
  { name: "Comune di Milano", country: "Italy", current: "OBSERVED", target: "PARTNER_CONFIRMED" },
  { name: "IRN Lisboa", country: "Portugal", current: "OBSERVED", target: "MULTI_SOURCE_CONFIRMED" },
  { name: "SRE Mexico City", country: "Mexico", current: "OBSERVED", target: "PARTNER_CONFIRMED" },
  { name: "Registro Civil CDMX", country: "Mexico", current: "VERIFICATION_REQUIRED", target: "PARTNER_CONFIRMED" },
  { name: "Conservatória Lisboa", country: "Portugal", current: "OBSERVED", target: "PARTNER_CONFIRMED" },
  { name: "Prefettura di Roma", country: "Italy", current: "OBSERVED", target: "PARTNER_CONFIRMED" },
  { name: "Prefettura L'Aquila", country: "Italy", current: "OBSERVED", target: "MULTI_SOURCE_CONFIRMED" },
  { name: "Ministry of Foreign Affairs", country: "Spain", current: "UNVERIFIED", target: "OBSERVED" },
];

function confidenceColor(level: string): string {
  switch (level) {
    case "AUTHORITY_VERIFIED": return EMERALD;
    case "MULTI_SOURCE_CONFIRMED": return "#22c55e";
    case "PARTNER_CONFIRMED": return GOLD;
    case "OBSERVED": return AMBER;
    case "VERIFICATION_REQUIRED": return RED;
    case "UNVERIFIED": return "rgba(255,255,255,0.2)";
    default: return "rgba(255,255,255,0.2)";
  }
}

function confidenceLabel(level: string): string {
  switch (level) {
    case "AUTHORITY_VERIFIED": return "Auth Verified";
    case "MULTI_SOURCE_CONFIRMED": return "Multi-Source";
    case "PARTNER_CONFIRMED": return "Partner Conf.";
    case "OBSERVED": return "Observed";
    case "VERIFICATION_REQUIRED": return "Needs Verify";
    case "UNVERIFIED": return "Unverified";
    default: return level;
  }
}

interface Props {
  countryStats: CountryStat[];
  globalStats: GlobalStats;
  confidenceCounts: ConfidenceCounts;
  total: number;
}

export function AuthorityAcquisition({ countryStats, globalStats, confidenceCounts, total }: Props) {
  const [copiedTarget, setCopiedTarget] = useState<string | null>(null);

  const funnelSegments = [
    { key: "UNVERIFIED", label: "Unverified", count: confidenceCounts.UNVERIFIED, color: "rgba(255,255,255,0.12)" },
    { key: "VERIFICATION_REQUIRED", label: "Needs Verify", count: confidenceCounts.VERIFICATION_REQUIRED, color: "rgba(239,68,68,0.3)" },
    { key: "OBSERVED", label: "Observed", count: confidenceCounts.OBSERVED, color: AMBER },
    { key: "PARTNER_CONFIRMED", label: "Partner", count: confidenceCounts.PARTNER_CONFIRMED, color: GOLD },
    { key: "MULTI_SOURCE_CONFIRMED", label: "Multi-Source", count: confidenceCounts.MULTI_SOURCE_CONFIRMED, color: "#22c55e" },
    { key: "AUTHORITY_VERIFIED", label: "Auth Verified", count: confidenceCounts.AUTHORITY_VERIFIED, color: EMERALD },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{ background: "#0A0A0A", minHeight: "100vh", padding: "32px 24px", fontFamily: "inherit" }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: `rgba(198,165,90,0.5)`, marginBottom: 8 }}>
          Intelligence · Authority Moat
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TrendingUp size={20} color={GOLD} />
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: 0 }}>Authority Acquisition Engine</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 6, maxWidth: 580 }}>
          Systematically promote authority confidence across all active jurisdictions. This is the competitive moat scoreboard.
        </p>
      </div>

      {/* Global Scoreboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Total Authorities", value: globalStats.total, color: "rgba(255,255,255,0.7)", icon: null },
          { label: "Verified (3 Levels)", value: globalStats.verified, color: EMERALD, icon: <CheckCircle2 size={14} /> },
          { label: "Observed", value: globalStats.observed, color: GOLD, icon: <Eye size={14} /> },
          { label: "Needs Verification", value: globalStats.needs_work, color: globalStats.needs_work > 0 ? AMBER : EMERALD, icon: globalStats.needs_work > 0 ? <AlertTriangle size={14} /> : null },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.32, ease: EASE }}
            style={{
              background: "rgba(8,5,1,0.97)",
              border: "1px solid rgba(212,175,55,0.08)",
              borderRadius: 8,
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: stat.color, marginBottom: 6 }}>
              {stat.icon}
              <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                {stat.label}
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Confidence Funnel */}
      <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, padding: "20px 24px", marginBottom: 32 }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: `rgba(198,165,90,0.5)`, marginBottom: 16 }}>
          Confidence Funnel Distribution
        </p>
        <div style={{ display: "flex", height: 36, borderRadius: 4, overflow: "hidden", gap: 1 }}>
          {funnelSegments.map((seg, i) => {
            const pct = total > 0 ? (seg.count / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <motion.div
                key={seg.key}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: EASE }}
                title={`${seg.label}: ${seg.count} (${Math.round(pct)}%)`}
                style={{
                  background: seg.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  minWidth: 2,
                  flexShrink: 0,
                }}
              >
                {pct > 8 && (
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: "#000", fontWeight: 700, whiteSpace: "nowrap", padding: "0 4px" }}>
                    {seg.count}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          {funnelSegments.map((seg) => (
            <div key={seg.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{seg.label}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>({seg.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Country Scoreboard */}
      <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, marginBottom: 32, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: `rgba(198,165,90,0.5)`, margin: 0 }}>
            Country Acquisition Scoreboard
          </p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["Country", "Total", "Observed", "Partner Conf.", "Multi-Source", "Auth Verified", "Coverage"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countryStats.map((cs, i) => {
                const isTier1 = TIER1_COUNTRIES.has(cs.country);
                return (
                  <motion.tr
                    key={cs.country}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.025, duration: 0.25 }}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      background: isTier1 ? "rgba(198,165,90,0.03)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isTier1 && <span style={{ fontSize: 9, color: GOLD, fontFamily: "monospace" }}>★</span>}
                        <span style={{ fontSize: 13, color: isTier1 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)", fontWeight: isTier1 ? 500 : 400 }}>
                          {cs.country}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{cs.total}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: cs.observed > 0 ? AMBER : "rgba(255,255,255,0.2)" }}>{cs.observed}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: cs.partner_confirmed > 0 ? GOLD : "rgba(255,255,255,0.2)" }}>{cs.partner_confirmed}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: cs.multi_source > 0 ? "#22c55e" : "rgba(255,255,255,0.2)" }}>{cs.multi_source}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: cs.authority_verified > 0 ? EMERALD : "rgba(255,255,255,0.2)" }}>{cs.authority_verified}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${cs.coverage_pct}%`, height: "100%", background: GOLD, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, color: cs.coverage_pct > 0 ? GOLD : "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                          {cs.coverage_pct}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Acquisition Targets */}
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: `rgba(198,165,90,0.5)`, marginBottom: 16 }}>
          Priority Acquisition Targets
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
          {PRIORITY_TARGETS.map((target, i) => (
            <motion.div
              key={target.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, duration: 0.32, ease: EASE }}
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>{target.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{target.country}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{
                  fontSize: 10, fontFamily: "monospace", padding: "2px 8px", borderRadius: 3,
                  background: `${confidenceColor(target.current)}22`, color: confidenceColor(target.current), border: `1px solid ${confidenceColor(target.current)}40`
                }}>
                  {confidenceLabel(target.current)}
                </span>
                <ArrowRight size={12} color="rgba(255,255,255,0.3)" />
                <span style={{
                  fontSize: 10, fontFamily: "monospace", padding: "2px 8px", borderRadius: 3,
                  background: `${confidenceColor(target.target)}22`, color: confidenceColor(target.target), border: `1px solid ${confidenceColor(target.target)}40`
                }}>
                  → {confidenceLabel(target.target)}
                </span>
              </div>
              <button
                onClick={() => {
                  setCopiedTarget(target.name);
                  setTimeout(() => setCopiedTarget(null), 2000);
                }}
                style={{
                  fontSize: 11, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "6px 12px", borderRadius: 4, border: `1px solid rgba(198,165,90,0.2)`,
                  background: "transparent", color: GOLD, cursor: "pointer", width: "100%",
                }}
              >
                {copiedTarget === target.name ? "Queued for Research" : "Begin Research"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
