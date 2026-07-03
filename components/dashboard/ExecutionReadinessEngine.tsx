"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import {
  getAllCountries,
  getAllDocumentTypes,
} from "@/data/intelligence";
import type {
  ReadinessResult,
  ReadinessItem,
} from "@/lib/executionReadiness";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";
const RED = "rgba(239,68,68,0.85)";
const AMBER = "rgba(245,158,11,0.85)";
const MUTED = "rgba(255,255,255,0.28)";
const SURFACE = "rgba(255,255,255,0.02)";
const BORDER = "rgba(255,255,255,0.07)";

const EASE = [0.16, 1, 0.3, 1] as const;

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, riskLevel }: { score: number; riskLevel: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color =
    score >= 70 ? EMERALD : score >= 40 ? GOLD : RED;

  return (
    <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
      <svg width={88} height={88} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={44} cy={44} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <motion.circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{ color, fontSize: 20, fontWeight: 600, fontFamily: "monospace", lineHeight: 1 }}
        >
          {score}
        </motion.span>
        <span style={{ color: MUTED, fontSize: 9, fontFamily: "monospace" }}>%</span>
      </div>
    </div>
  );
}

// ── Readiness item row ────────────────────────────────────────────────────────

function ReadinessRow({ item, index }: { item: ReadinessItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor =
    item.status === "complete" ? EMERALD :
    item.status === "pending" ? GOLD :
    item.status === "not-required" ? MUTED : MUTED;
  const statusMark =
    item.status === "complete" ? "✓" :
    item.status === "pending" ? "○" :
    item.status === "not-required" ? "—" : "?";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay: 0.1 + index * 0.06, ease: "easeOut" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "9px 0",
          borderBottom: `1px solid ${BORDER}`,
          cursor: item.note ? "pointer" : "default",
        }}
        onClick={() => item.note && setExpanded((e) => !e)}
      >
        <span style={{ color: statusColor, fontSize: 12, fontFamily: "monospace", flexShrink: 0, marginTop: 1, width: 14, textAlign: "center" }}>
          {statusMark}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: item.status === "complete" ? "rgba(255,255,255,0.7)" : item.status === "not-required" ? MUTED : "rgba(255,255,255,0.55)", fontSize: 12 }}>
            {item.label}
          </span>
          <AnimatePresence>
            {expanded && item.note && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                style={{ color: MUTED, fontSize: 11, lineHeight: 1.5, marginTop: 4, overflow: "hidden" }}
              >
                {item.note}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        {item.note && (
          <span style={{ color: MUTED, fontSize: 9, flexShrink: 0, marginTop: 2 }}>
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Rejection risk card ───────────────────────────────────────────────────────

function RiskCard({ risk, index }: { risk: { trigger: string; description: string; severity: string }; index: number }) {
  const isFatal = risk.severity === "fatal";
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 * index, ease: "easeOut" }}
      style={{
        background: SURFACE,
        border: `1px solid ${isFatal ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
        borderRadius: 4,
        padding: "10px 12px",
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isFatal ? RED : AMBER, flexShrink: 0, marginTop: 4 }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ color: isFatal ? "rgba(252,165,165,0.9)" : "rgba(252,211,77,0.9)", fontSize: 11, fontWeight: 600 }}>
              {risk.trigger}
            </span>
            <span style={{ color: isFatal ? RED : AMBER, fontSize: 8, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {risk.severity}
            </span>
          </div>
          <p style={{ color: MUTED, fontSize: 10, lineHeight: 1.5, margin: 0 }}>{risk.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Result panel ──────────────────────────────────────────────────────────────

function ResultPanel({ result, countryId, documentId }: {
  result: ReadinessResult;
  countryId: string;
  documentId: string;
}) {
  const [tab, setTab] = useState<"checklist" | "path" | "risks">("checklist");

  const riskColor =
    result.riskLevel === "low" ? EMERALD :
    result.riskLevel === "medium" ? GOLD : RED;

  return (
    <motion.div
      key={`${countryId}-${documentId}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{ marginTop: 20 }}
    >
      {/* Score header */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16, padding: "16px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 6 }}>
        <ScoreRing score={result.score} riskLevel={result.riskLevel} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 400 }}>
              Execution Readiness
            </span>
            <span style={{
              fontSize: 9, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase",
              padding: "2px 8px", borderRadius: 3,
              border: `1px solid ${result.isDerived ? "rgba(148,163,184,0.3)" : "rgba(74,222,128,0.3)"}`,
              color: result.isDerived ? "rgba(148,163,184,0.65)" : "rgba(74,222,128,0.75)",
            }}>
              {result.corridorLabel}
            </span>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <span style={{ color: MUTED, fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>Risk Level</span>
              <p style={{ color: riskColor, fontSize: 11, fontFamily: "monospace", margin: "2px 0 0" }}>{result.riskLevel.toUpperCase()}</p>
            </div>
            <div>
              <span style={{ color: MUTED, fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>Timeline</span>
              <p style={{ color: GOLD, fontSize: 11, fontFamily: "monospace", margin: "2px 0 0" }}>{result.timeline}</p>
            </div>
            <div>
              <span style={{ color: MUTED, fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>RON Eligible</span>
              <p style={{ color: result.ronEligible ? EMERALD : MUTED, fontSize: 11, fontFamily: "monospace", margin: "2px 0 0" }}>
                {result.ronEligible ? "Yes" : "No"}
              </p>
            </div>
            {result.witnessRequired && (
              <div>
                <span style={{ color: MUTED, fontSize: 9, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em" }}>Witnesses</span>
                <p style={{ color: GOLD, fontSize: 11, fontFamily: "monospace", margin: "2px 0 0" }}>{result.witnessCount} required</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Missing items alert */}
      {result.missing.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{
            padding: "10px 14px",
            background: result.fatalBlockers.length > 0 ? "rgba(239,68,68,0.05)" : "rgba(245,158,11,0.05)",
            border: `1px solid ${result.fatalBlockers.length > 0 ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
            borderRadius: 4,
            marginBottom: 14,
          }}
        >
          <span style={{ color: result.fatalBlockers.length > 0 ? "rgba(252,165,165,0.85)" : "rgba(252,211,77,0.85)", fontSize: 11 }}>
            {result.fatalBlockers.length > 0
              ? `${result.fatalBlockers.length} blocking item${result.fatalBlockers.length > 1 ? "s" : ""}: ${result.fatalBlockers.map((i) => i.label).join(", ")}`
              : `${result.missing.length} item${result.missing.length > 1 ? "s" : ""} pending: ${result.missing.map((i) => i.label).join(", ")}`
            }
          </span>
        </motion.div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 14 }}>
        {(["checklist", "path", "risks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "7px 16px",
              background: "none",
              border: "none",
              borderBottom: tab === t ? `2px solid ${GOLD}` : "2px solid transparent",
              color: tab === t ? GOLD : MUTED,
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {t === "checklist" ? "Checklist" : t === "path" ? "Execution Path" : `Risks (${result.rejectionRisks.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "checklist" && (
          <motion.div key="checklist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {result.items.map((item, i) => (
              <ReadinessRow key={item.id} item={item} index={i} />
            ))}
          </motion.div>
        )}

        {tab === "path" && (
          <motion.div key="path" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {result.executionPath.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.24, delay: i * 0.05 }}
                style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: i < result.executionPath.length - 1 ? 0 : 0 }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(198,165,90,0.1)", border: `1px solid rgba(198,165,90,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontFamily: "monospace", color: GOLD }}>
                    {i + 1}
                  </div>
                  {i < result.executionPath.length - 1 && (
                    <div style={{ width: 1, height: 20, background: BORDER }} />
                  )}
                </div>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.55, paddingBottom: i < result.executionPath.length - 1 ? 8 : 0, paddingTop: 3, margin: 0 }}>
                  {step}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === "risks" && (
          <motion.div key="risks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {result.rejectionRisks.length === 0 ? (
              <p style={{ color: MUTED, fontSize: 12 }}>No rejection risks identified for this corridor.</p>
            ) : (
              result.rejectionRisks.map((risk, i) => (
                <RiskCard key={i} risk={risk} index={i} />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Special instructions */}
      {result.translationRequired && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: 14, padding: "10px 14px", borderLeft: `3px solid rgba(198,165,90,0.4)`, background: "rgba(198,165,90,0.04)", borderRadius: "0 4px 4px 0" }}
        >
          <p style={{ color: GOLD, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 4px" }}>Translation Required</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.5, margin: 0 }}>
            {result.certifiedTranslationRequired
              ? `Certified ${result.translationLanguage} translation by a sworn translator required before courier release.`
              : `${result.translationLanguage} translation required.`}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  /** Pre-selected values when opened from a specific matter */
  initialCountry?: string;
  initialDocument?: string;
}

export function ExecutionReadinessEngine({ initialCountry = "", initialDocument = "" }: Props) {
  const countries = getAllCountries();
  const documents = getAllDocumentTypes();

  const [countryId, setCountryId] = useState(initialCountry);
  const [documentId, setDocumentId] = useState(initialDocument);
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchReadiness(cId: string, dId: string) {
    if (!cId || !dId) { setResult(null); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/dashboard/execution-readiness?country=${encodeURIComponent(cId)}&document=${encodeURIComponent(dId)}`);
      if (r.ok) {
        const data = (await r.json()) as { readiness: ReadinessResult };
        setResult(data.readiness);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCountry(val: string) {
    setCountryId(val);
    if (val && documentId) fetchReadiness(val, documentId);
    else setResult(null);
  }

  function handleDocument(val: string) {
    setDocumentId(val);
    if (countryId && val) fetchReadiness(countryId, val);
    else setResult(null);
  }

  return (
    <div>
      <div style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.6)", marginBottom: 4 }}>
        Execution Readiness Engine
      </div>
      <h3 style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, fontFamily: "Georgia, serif", fontWeight: 400, margin: "0 0 14px" }}>
        Corridor Intelligence
      </h3>

      {/* Selector row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ display: "block", color: MUTED, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 5 }}>
            Destination Country
          </label>
          <select
            value={countryId}
            onChange={(e) => handleCountry(e.target.value)}
            style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 4, color: countryId ? "rgba(255,255,255,0.8)" : MUTED, fontSize: 12, padding: "7px 10px", outline: "none", cursor: "pointer" }}
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id} style={{ background: "#111" }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: "block", color: MUTED, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 5 }}>
            Document Type
          </label>
          <select
            value={documentId}
            onChange={(e) => handleDocument(e.target.value)}
            style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 4, color: documentId ? "rgba(255,255,255,0.8)" : MUTED, fontSize: 12, padding: "7px 10px", outline: "none", cursor: "pointer" }}
          >
            <option value="">Select document</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id} style={{ background: "#111" }}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Readiness Reveal */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "24px 0", textAlign: "center" }}
          >
            <span style={{ color: MUTED, fontSize: 11, fontFamily: "monospace" }}>Computing readiness…</span>
          </motion.div>
        )}
        {!loading && result && (
          <ResultPanel
            key={`${countryId}-${documentId}`}
            result={result}
            countryId={countryId}
            documentId={documentId}
          />
        )}
        {!loading && !result && countryId && documentId && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "16px 0", color: MUTED, fontSize: 12 }}>
            Select both country and document to compute readiness.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
