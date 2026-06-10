"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Search, Globe2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

// ── Registry data ──────────────────────────────────────────────────────────────
// Pattern: Global Document Registry Match (extracted from Liaison OS architecture)

type HaguePath = "apostille" | "legalization" | "both" | "neither";
type RONEligibility = "yes" | "no" | "conditional";

interface RegistryEntry {
  destination_country: string;
  country_code: string;
  hague_member: boolean;
  path: HaguePath;
  ron_eligible: RONEligibility;
  translation_required: boolean;
  courier_required: boolean;
  processing_days: string;
  notes: string;
  risk: "low" | "medium" | "high";
}

const REGISTRY: RegistryEntry[] = [
  { destination_country: "Portugal", country_code: "PT", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "10–15", notes: "Apostille from FL Sec of State. Certified PT translation required.", risk: "low" },
  { destination_country: "Brazil", country_code: "BR", hague_member: true, path: "apostille", ron_eligible: "conditional", translation_required: true, courier_required: true, processing_days: "14–21", notes: "Apostille required. Brazilian consulate may require sworn translation.", risk: "medium" },
  { destination_country: "Mexico", country_code: "MX", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "10–14", notes: "Spanish translation required. Apostille from issuing state.", risk: "low" },
  { destination_country: "Italy", country_code: "IT", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "14–21", notes: "Italian translation required. Apostille from issuing state.", risk: "medium" },
  { destination_country: "Germany", country_code: "DE", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "10–14", notes: "German translation required by sworn translator.", risk: "low" },
  { destination_country: "France", country_code: "FR", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "10–14", notes: "French translation required. Apostille from issuing state.", risk: "low" },
  { destination_country: "Spain", country_code: "ES", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "10–14", notes: "Spanish translation required.", risk: "low" },
  { destination_country: "Japan", country_code: "JP", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "14–21", notes: "Japanese translation required. Apostille from issuing state.", risk: "medium" },
  { destination_country: "Nigeria", country_code: "NG", hague_member: false, path: "legalization", ron_eligible: "no", translation_required: false, courier_required: true, processing_days: "21–35", notes: "Non-Hague. Requires US federal apostille + embassy legalization.", risk: "high" },
  { destination_country: "Senegal", country_code: "SN", hague_member: false, path: "legalization", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "25–40", notes: "Non-Hague. Embassy legalization + French translation.", risk: "high" },
  { destination_country: "United Arab Emirates", country_code: "AE", hague_member: false, path: "legalization", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "21–35", notes: "Non-Hague. MOFA attestation required. Arabic translation for personal docs.", risk: "high" },
  { destination_country: "Canada", country_code: "CA", hague_member: true, path: "apostille", ron_eligible: "yes", translation_required: false, courier_required: false, processing_days: "5–10", notes: "RON accepted for most document types. Apostille from issuing state.", risk: "low" },
  { destination_country: "United Kingdom", country_code: "GB", hague_member: true, path: "apostille", ron_eligible: "conditional", translation_required: false, courier_required: false, processing_days: "7–10", notes: "RON accepted by most UK institutions. Apostille from issuing state.", risk: "low" },
  { destination_country: "Australia", country_code: "AU", hague_member: true, path: "apostille", ron_eligible: "conditional", translation_required: false, courier_required: true, processing_days: "10–14", notes: "Apostille accepted. RON acceptance varies by institution.", risk: "low" },
  { destination_country: "China", country_code: "CN", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: true, courier_required: true, processing_days: "21–35", notes: "Joined Hague 2023. Chinese translation required. Strict notarization standards.", risk: "high" },
  { destination_country: "India", country_code: "IN", hague_member: true, path: "apostille", ron_eligible: "no", translation_required: false, courier_required: true, processing_days: "14–21", notes: "Apostille required for most personal documents. No translation typically required.", risk: "medium" },
  { destination_country: "Colombia", country_code: "CO", hague_member: true, path: "apostille", ron_eligible: "conditional", translation_required: true, courier_required: true, processing_days: "14–21", notes: "Spanish translation required. Apostille from issuing state.", risk: "medium" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const RISK_COLOR = { low: "rgba(34,197,94,0.75)", medium: "rgba(245,158,11,0.75)", high: "rgba(239,68,68,0.75)" };
const RISK_BG   = { low: "rgba(34,197,94,0.05)", medium: "rgba(245,158,11,0.05)", high: "rgba(239,68,68,0.05)" };
const RISK_BORDER = { low: "rgba(34,197,94,0.15)", medium: "rgba(245,158,11,0.15)", high: "rgba(239,68,68,0.15)" };

const PATH_COLOR: Record<HaguePath, string> = {
  apostille: "rgba(99,102,241,0.75)",
  legalization: "rgba(239,68,68,0.7)",
  both: "rgba(245,158,11,0.75)",
  neither: "rgba(255,255,255,0.3)",
};

const RON_COLOR: Record<RONEligibility, string> = {
  yes: "rgba(34,197,94,0.75)",
  no: "rgba(255,255,255,0.2)",
  conditional: "rgba(245,158,11,0.65)",
};

const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RoutingRulesPage() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<"low" | "medium" | "high" | "all">("all");
  const [haguFilter, setHagueFilter] = useState<"all" | "hague" | "non_hague">("all");

  const filtered = useMemo(() => {
    return REGISTRY.filter((r) => {
      if (riskFilter !== "all" && r.risk !== riskFilter) return false;
      if (haguFilter === "hague" && !r.hague_member) return false;
      if (haguFilter === "non_hague" && r.hague_member) return false;
      const q = search.toLowerCase();
      if (q && !r.destination_country.toLowerCase().includes(q) && !r.country_code.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, riskFilter, haguFilter]);

  const highRisk = REGISTRY.filter((r) => r.risk === "high").length;

  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      <Link href="/dashboard/matter-intelligence"
        className="inline-flex items-center gap-1.5 mb-5 text-[10px] hover:opacity-80 transition-opacity"
        style={{ color: GOLD_DIM, letterSpacing: "0.15em" }}>
        <ArrowLeft size={11} /> MATTER INTELLIGENCE
      </Link>

      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>GLOBAL REGISTRY MATCH</p>
        <h1 style={{ fontSize: "clamp(1rem,2.5vw,1.35rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8", marginBottom: 4 }}>
          Execution Rules / Routing Map
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Match destination country against Hague path, apostille vs legalization, RON eligibility, translation requirement, and courier necessity.
        </p>
      </div>

      {highRisk > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-sm px-4 py-2.5"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <AlertTriangle size={12} style={{ color: "rgba(239,68,68,0.7)" }} />
          <span style={{ fontSize: 10, color: "rgba(239,68,68,0.65)", letterSpacing: "0.08em" }}>
            {highRisk} HIGH-RISK destinations require embassy legalization — not apostille. Verify before execution.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={12} style={{ color: GOLD_DIM, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" placeholder="Search country..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm bg-transparent outline-none text-[12px]"
            style={{ border: `1px solid ${BORDER}`, color: "#e8e4dc", padding: "6px 10px 6px 28px", fontFamily: "monospace", caretColor: "rgba(212,175,55,0.6)" }} />
        </div>

        <div className="flex gap-1">
          {(["all", "hague", "non_hague"] as const).map((v) => (
            <button key={v} onClick={() => setHagueFilter(v)}
              className="px-2.5 py-1.5 rounded-sm text-[9px] tracking-widest transition-colors"
              style={{
                border: `1px solid ${haguFilter === v ? "rgba(212,175,55,0.5)" : BORDER}`,
                color: haguFilter === v ? "rgba(212,175,55,0.9)" : GOLD_DIM,
                background: haguFilter === v ? "rgba(212,175,55,0.07)" : "transparent",
              }}>
              {v === "all" ? "ALL" : v === "hague" ? "HAGUE" : "NON-HAGUE"}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {(["all", "low", "medium", "high"] as const).map((v) => (
            <button key={v} onClick={() => setRiskFilter(v)}
              className="px-2.5 py-1.5 rounded-sm text-[9px] tracking-widest transition-colors"
              style={{
                border: `1px solid ${riskFilter === v && v !== "all" ? RISK_COLOR[v as "low" | "medium" | "high"] : BORDER}`,
                color: riskFilter === v && v !== "all" ? RISK_COLOR[v as "low" | "medium" | "high"] : GOLD_DIM,
                background: riskFilter === v && v !== "all" ? RISK_BG[v as "low" | "medium" | "high"] : "transparent",
              }}>
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-[180px_90px_100px_80px_80px_80px_80px_1fr] gap-3 px-4 py-2 mb-1"
        style={{ background: "rgba(212,175,55,0.04)", border: `1px solid ${BORDER}`, borderRadius: "2px 2px 0 0" }}>
        {["COUNTRY", "HAGUE", "PATH", "RON", "TRANSL.", "COURIER", "DAYS", "NOTES"].map((h) => (
          <span key={h} style={{ fontSize: 8, letterSpacing: "0.2em", color: GOLD_DIM }}>{h}</span>
        ))}
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${BORDER}`, borderTop: "none" }}>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center" style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>No countries match.</div>
        )}
        {filtered.map((r, i) => (
          <div key={r.country_code}
            className="px-4 py-3 flex flex-col md:grid md:grid-cols-[180px_90px_100px_80px_80px_80px_80px_1fr] gap-2 md:gap-3 md:items-start hover:bg-white/[0.02] transition-colors"
            style={{ borderTop: i > 0 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>

            {/* Country */}
            <div className="flex items-center gap-2">
              <Globe2 size={11} style={{ color: GOLD_DIM, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, color: "#e8e4dc" }}>{r.destination_country}</div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)" }}>{r.country_code}</div>
              </div>
            </div>

            {/* Hague */}
            <div className="flex items-center gap-1">
              {r.hague_member
                ? <CheckCircle2 size={11} style={{ color: "rgba(34,197,94,0.7)" }} />
                : <XCircle size={11} style={{ color: "rgba(239,68,68,0.6)" }} />}
              <span style={{ fontSize: 9, color: r.hague_member ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.6)" }}>
                {r.hague_member ? "YES" : "NO"}
              </span>
            </div>

            {/* Path */}
            <span className="px-1.5 py-0.5 rounded-sm" style={{ fontSize: 8, color: PATH_COLOR[r.path], border: `1px solid ${PATH_COLOR[r.path]}`, display: "inline-block", letterSpacing: "0.1em" }}>
              {r.path.toUpperCase()}
            </span>

            {/* RON */}
            <span style={{ fontSize: 9, color: RON_COLOR[r.ron_eligible] }}>{r.ron_eligible.toUpperCase()}</span>

            {/* Translation */}
            <span style={{ fontSize: 9, color: r.translation_required ? "rgba(245,158,11,0.7)" : "rgba(255,255,255,0.2)" }}>
              {r.translation_required ? "REQUIRED" : "NO"}
            </span>

            {/* Courier */}
            <span style={{ fontSize: 9, color: r.courier_required ? "rgba(59,130,246,0.7)" : "rgba(255,255,255,0.2)" }}>
              {r.courier_required ? "YES" : "OPTIONAL"}
            </span>

            {/* Days */}
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums" }}>
              {r.processing_days}d
            </span>

            {/* Notes */}
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{r.notes}</span>

            {/* Risk badge (mobile only visible via color on row) */}
            <div className="md:hidden">
              <span className="px-1.5 py-0.5 rounded-sm text-[8px] tracking-widest"
                style={{ color: RISK_COLOR[r.risk], background: RISK_BG[r.risk], border: `1px solid ${RISK_BORDER[r.risk]}` }}>
                {r.risk.toUpperCase()} RISK
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3" style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
        {filtered.length} OF {REGISTRY.length} DESTINATIONS · GLOBAL DOCUMENT REGISTRY
      </div>
    </div>
  );
}
