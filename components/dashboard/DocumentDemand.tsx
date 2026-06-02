"use client";

import { motion } from "framer-motion";
import { FileSearch } from "lucide-react";
import type {
  DocDemandRow,
  CorridorDemandRow,
  MonthTrendRow,
  ReferralRow,
  CountryRow,
} from "@/app/dashboard/demand/page";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  topDocuments: DocDemandRow[];
  topCorridors: CorridorDemandRow[];
  monthlyTrend: MonthTrendRow[];
  referralSources: ReferralRow[];
  topCountries: CountryRow[];
}

// ─── Static document registry ─────────────────────────────────────────────────

interface DocRegistryEntry {
  typical_destinations: string;
  use_case: string;
  translation_required: boolean;
  apostille_required: boolean;
}

const DOC_REGISTRY: Record<string, DocRegistryEntry> = {
  "Birth Certificate": {
    typical_destinations: "Italy, Portugal, Mexico, Spain, Brazil, Greece",
    use_case: "Citizenship by descent, dual nationality, family law, estate",
    translation_required: true,
    apostille_required: true,
  },
  "Marriage Certificate": {
    typical_destinations: "Italy, Spain, Portugal, France, Mexico",
    use_case: "Citizenship, estate, property transfer, immigration",
    translation_required: true,
    apostille_required: true,
  },
  "Death Certificate": {
    typical_destinations: "Italy, Spain, Portugal, Mexico, France",
    use_case: "Estate administration, inheritance, probate proceedings",
    translation_required: true,
    apostille_required: true,
  },
  "Diploma/Degree": {
    typical_destinations: "Germany, Spain, France, UAE, Brazil",
    use_case: "Professional licensing, employment, residency, academic admission",
    translation_required: true,
    apostille_required: true,
  },
  Transcript: {
    typical_destinations: "Germany, France, Spain, Canada, Australia",
    use_case: "Graduate admission, professional licensing, credential recognition",
    translation_required: true,
    apostille_required: true,
  },
  "Power of Attorney": {
    typical_destinations: "Italy, France, Mexico, Spain, Brazil",
    use_case: "Real estate, estate management, business transactions",
    translation_required: true,
    apostille_required: true,
  },
  "FBI Background Check": {
    typical_destinations: "UAE, Portugal, Spain, Germany, Italy",
    use_case: "Visa applications, residency, employment, immigration",
    translation_required: false,
    apostille_required: true,
  },
  "Criminal Background Check": {
    typical_destinations: "UAE, Portugal, Spain, Germany, Italy",
    use_case: "Visa applications, residency, employment, immigration",
    translation_required: false,
    apostille_required: true,
  },
  "Articles of Incorporation": {
    typical_destinations: "Mexico, Brazil, Spain, UAE",
    use_case: "Corporate formation, banking, contracts, government filings",
    translation_required: true,
    apostille_required: true,
  },
  "Corporate Resolution": {
    typical_destinations: "Mexico, Brazil, Spain, Italy",
    use_case: "Banking, contracts, corporate restructuring",
    translation_required: true,
    apostille_required: true,
  },
  Affidavit: {
    typical_destinations: "Spain, Italy, Mexico, Brazil, France",
    use_case: "Legal proceedings, property, residency, immigration",
    translation_required: true,
    apostille_required: true,
  },
  "Medical Records": {
    typical_destinations: "Canada, UK, Germany, France, Spain",
    use_case: "Immigration medical clearance, insurance, professional licensing",
    translation_required: true,
    apostille_required: false,
  },
  "Divorce Decree": {
    typical_destinations: "Italy, Spain, Mexico, Portugal, Brazil",
    use_case: "Remarriage abroad, estate, residency, citizenship",
    translation_required: true,
    apostille_required: true,
  },
  "Adoption Order": {
    typical_destinations: "Mexico, Spain, Italy, Brazil",
    use_case: "Citizenship, residency, family law, immigration",
    translation_required: true,
    apostille_required: true,
  },
  "Notarized Affidavit": {
    typical_destinations: "Spain, Italy, Portugal, Mexico",
    use_case: "Legal proceedings, identity verification, residency",
    translation_required: true,
    apostille_required: true,
  },
  "Certificate of Good Standing": {
    typical_destinations: "Mexico, Spain, UAE, Brazil, Germany",
    use_case: "Business registration, banking, contracts, professional licensing",
    translation_required: false,
    apostille_required: true,
  },
};

const FALLBACK_DOCS = Object.keys(DOC_REGISTRY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(v: number) {
  if (v === 0) return "—";
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toLocaleString()}`;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Panel wrapper ────────────────────────────────────────────────────────────

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 8,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-mono text-[9px] tracking-[0.32em] uppercase px-5 pt-5 pb-3"
      style={{ color: "rgba(198,165,90,0.5)" }}
    >
      {children}
    </div>
  );
}

// ─── Document Bar Chart ───────────────────────────────────────────────────────

function DocBars({ rows }: { rows: DocDemandRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-2 px-5 pb-5">
      {rows.map((row, i) => {
        const pct = (row.count / max) * 100;
        const isTop3 = i < 3;
        return (
          <motion.div
            key={row.document_type}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ease: EASE, duration: 0.4, delay: i * 0.06 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[11px] font-mono truncate max-w-[200px]"
                style={{ color: isTop3 ? "#C6A55A" : "rgba(255,255,255,0.55)" }}
              >
                {row.document_type}
              </span>
              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: isTop3 ? "#C6A55A" : "rgba(255,255,255,0.35)" }}
                >
                  {row.count}
                </span>
                <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {fmt$(row.revenue)}
                </span>
                <span
                  className="text-[9px] font-mono"
                  style={{ color: row.conversion_rate >= 60 ? "#4a9e6b" : "rgba(255,255,255,0.25)" }}
                >
                  {row.conversion_rate}%
                </span>
              </div>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ ease: EASE, duration: 0.6, delay: i * 0.06 }}
                style={{
                  background: isTop3
                    ? "#C6A55A"
                    : "rgba(198,165,90,0.35)",
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Monthly Bar Chart ────────────────────────────────────────────────────────

function MonthlyChart({ rows }: { rows: MonthTrendRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex items-end gap-1.5 h-28 px-5 pb-4">
      {rows.map((row, i) => {
        const pct = (row.count / max) * 100;
        return (
          <div key={row.label} className="flex flex-col items-center gap-1 flex-1">
            <motion.div
              className="w-full rounded-sm"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${Math.max(4, pct)}%`, opacity: 1 }}
              transition={{ ease: EASE, duration: 0.5, delay: i * 0.04 }}
              style={{
                background: row.isCurrent
                  ? "#C6A55A"
                  : "rgba(198,165,90,0.38)",
                minHeight: 4,
                maxHeight: "100%",
              }}
            />
            <span
              className="text-[7px] font-mono"
              style={{ color: row.isCurrent ? "#C6A55A" : "rgba(255,255,255,0.22)" }}
            >
              {row.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentDemand({
  topDocuments,
  topCorridors,
  monthlyTrend,
  referralSources,
  topCountries,
}: Props) {
  // Build registry entries for docs that appear in real data (or fallback)
  const realDocTypes = topDocuments.map((d) => d.document_type);
  const registryDocs =
    realDocTypes.length > 0
      ? realDocTypes.filter((d) => DOC_REGISTRY[d])
      : FALLBACK_DOCS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: EASE, duration: 0.32 }}
      className="min-h-screen px-6 py-8 space-y-6"
      style={{ background: "#0A0A0A" }}
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(198,165,90,0.08)", border: "1px solid rgba(198,165,90,0.15)" }}
        >
          <FileSearch className="w-4 h-4" style={{ color: "#C6A55A" }} />
        </div>
        <div>
          <h1 className="text-sm font-mono tracking-[0.18em] uppercase" style={{ color: "#C6A55A" }}>
            Document Demand Engine
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            What the market is actually asking for — by type, corridor, source, and month.
          </p>
        </div>
      </div>

      {/* ── Top 10 document types ─────────────────────────────────────────── */}
      <Panel>
        <SectionLabel>Top Document Types — by Demand</SectionLabel>
        <div
          className="grid grid-cols-4 gap-0 px-5 pb-2 text-[8px] font-mono uppercase tracking-[0.22em]"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          <span className="col-span-2">Document</span>
          <span className="text-right">Matters</span>
          <span className="text-right">Revenue · Conv%</span>
        </div>
        {topDocuments.length > 0 ? (
          <DocBars rows={topDocuments} />
        ) : (
          <p className="px-5 pb-5 text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            No document data available yet.
          </p>
        )}
      </Panel>

      {/* ── Top corridors table ───────────────────────────────────────────── */}
      <Panel>
        <SectionLabel>Top Corridors — Country × Document</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr
                className="text-left font-mono text-[8px] uppercase tracking-[0.22em]"
                style={{ color: "rgba(255,255,255,0.2)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <th className="px-5 py-2 font-normal">Country</th>
                <th className="px-3 py-2 font-normal">Document</th>
                <th className="px-3 py-2 font-normal text-right">Matters</th>
                <th className="px-3 py-2 font-normal text-right">Revenue</th>
                <th className="px-5 py-2 font-normal text-right">Avg Value</th>
              </tr>
            </thead>
            <tbody>
              {topCorridors.length > 0 ? (
                topCorridors.map((row, i) => (
                  <motion.tr
                    key={row.key}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: EASE, duration: 0.3, delay: i * 0.02 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td className="px-5 py-2.5" style={{ color: "#C6A55A" }}>
                      {row.country}
                    </td>
                    <td className="px-3 py-2.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {row.document}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {row.count}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>
                      {fmt$(row.revenue)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {row.avg_value > 0 ? fmt$(row.avg_value) : "—"}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-5 text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                    No corridor data available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* ── Two-column bottom ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6">
        {/* Monthly trend */}
        <Panel>
          <SectionLabel>Monthly Demand — Last 12 Months</SectionLabel>
          <MonthlyChart rows={monthlyTrend} />
        </Panel>

        {/* Referral sources */}
        <Panel>
          <SectionLabel>Demand by Referral Source</SectionLabel>
          <div className="px-5 pb-5 space-y-2">
            {referralSources.length > 0 ? (
              referralSources.map((row, i) => (
                <motion.div
                  key={row.source}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ease: EASE, duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <span className="text-[11px] font-mono truncate max-w-[180px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {row.source}
                  </span>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-[10px] font-mono" style={{ color: "#C6A55A" }}>
                      {row.count}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {fmt$(row.revenue)}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                No referral data available.
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* ── Document intelligence panel ───────────────────────────────────── */}
      <Panel>
        <SectionLabel>Document Intelligence Registry — Operator Context</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-px mx-5 mb-5" style={{ background: "rgba(255,255,255,0.04)", borderRadius: 4 }}>
          {registryDocs.slice(0, 12).map((docName, i) => {
            const entry = DOC_REGISTRY[docName];
            if (!entry) return null;
            return (
              <motion.div
                key={docName}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease: EASE, duration: 0.3, delay: i * 0.04 }}
                className="p-4 space-y-2"
                style={{ background: "rgba(8,5,1,0.97)" }}
              >
                <div className="text-[10px] font-mono" style={{ color: "#C6A55A" }}>
                  {docName}
                </div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {entry.use_case}
                </div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {entry.typical_destinations}
                </div>
                <div className="flex gap-3 mt-1">
                  <span
                    className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                    style={{
                      background: entry.apostille_required ? "rgba(198,165,90,0.1)" : "rgba(255,255,255,0.04)",
                      color: entry.apostille_required ? "rgba(198,165,90,0.7)" : "rgba(255,255,255,0.2)",
                    }}
                  >
                    Apostille: {entry.apostille_required ? "Yes" : "No"}
                  </span>
                  <span
                    className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                    style={{
                      background: entry.translation_required ? "rgba(74,158,107,0.1)" : "rgba(255,255,255,0.04)",
                      color: entry.translation_required ? "rgba(74,158,107,0.7)" : "rgba(255,255,255,0.2)",
                    }}
                  >
                    Translation: {entry.translation_required ? "Yes" : "No"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Panel>
    </motion.div>
  );
}
