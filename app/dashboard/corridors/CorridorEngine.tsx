"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import type { CorridorRow } from "./page";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";

const PRIORITY_TARGETS = [
  { country: "Italy", docType: "Birth Certificate", flag: "🇮🇹" },
  { country: "Italy", docType: "Power of Attorney", flag: "🇮🇹" },
  { country: "Portugal", docType: "Birth Certificate", flag: "🇵🇹" },
  { country: "Mexico", docType: "Corporate Docs", flag: "🇲🇽" },
  { country: "Mexico", docType: "Birth Certificate", flag: "🇲🇽" },
  { country: "Germany", docType: "Diploma", flag: "🇩🇪" },
];

const ITALY_NODES = [
  "Comune di Roma",
  "Prefettura di Roma",
  "Apostille Stamp",
  "Translation (if required)",
  "Courier Release",
];

type CertifyState = "Derived" | "Observed" | "Verified" | "Certified";

function StatusBadge({ status }: { status: CertifyState }) {
  const map: Record<CertifyState, { bg: string; color: string }> = {
    Derived: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" },
    Observed: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    Verified: { bg: "rgba(74,158,107,0.12)", color: EMERALD },
    Certified: { bg: "rgba(198,165,90,0.12)", color: GOLD },
  };
  const { bg, color } = map[status];
  return (
    <span
      className="text-[10px] font-mono px-2 py-0.5 rounded"
      style={{ background: bg, color }}
    >
      {status}
    </span>
  );
}

export function CorridorEngine({ corridors }: { corridors: CorridorRow[] }) {
  const [certifyStates, setCertifyStates] = useState<
    Record<string, CertifyState>
  >({});
  const [certifyingKey, setCertifyingKey] = useState<string | null>(null);
  const [activeNodeIdx, setActiveNodeIdx] = useState(-1);

  const totalDerived = corridors.length;

  function getState(key: string): CertifyState {
    return certifyStates[key] ?? "Derived";
  }

  async function certify(key: string) {
    setCertifyingKey(key);
    setActiveNodeIdx(-1);
    // Animate nodes sequentially
    for (let i = 0; i < ITALY_NODES.length; i++) {
      await new Promise((r) => setTimeout(r, i * 120));
      setActiveNodeIdx(i);
    }
    await new Promise((r) => setTimeout(r, 300));
    setCertifyStates((prev) => ({ ...prev, [key]: "Certified" }));
    setCertifyingKey(null);
    setActiveNodeIdx(-1);
  }

  const top5Keys = new Set(
    corridors.slice(0, 5).map((c) => `${c.destination_country}||${c.document_type}`)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen p-6 space-y-8"
      style={{ background: "#0A0A0A" }}
    >
      {/* Header */}
      <div>
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-2"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Intelligence / Corridor Engine
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: GOLD }}>
          Verified Corridor Engine
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          {totalDerived.toLocaleString()} derived corridors from matter data
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Corridors Derived", value: totalDerived },
          { label: "Corridors Observed", value: 0 },
          { label: "Corridors Verified", value: 0 },
          { label: "Corridors Certified", value: 0 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-lg p-4"
            style={{
              background: "rgba(8,5,1,0.97)",
              border: "1px solid rgba(212,175,55,0.08)",
            }}
          >
            <p
              className="font-mono text-[9px] tracking-[0.32em] uppercase mb-1"
              style={{ color: "rgba(198,165,90,0.5)" }}
            >
              {stat.label}
            </p>
            <p
              className="text-2xl font-semibold"
              style={{ color: stat.value > 0 ? GOLD : "rgba(255,255,255,0.3)" }}
            >
              {stat.value.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Corridor Registry Table */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Corridor Registry
        </p>
        {corridors.length === 0 ? (
          <p
            className="text-sm font-mono"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            No corridor data available. Complete matters to derive corridors.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Country", "Document Type", "Matters", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-4 font-mono text-[9px] tracking-[0.2em] uppercase"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {corridors.map((c, i) => {
                  const key = `${c.destination_country}||${c.document_type}`;
                  const state = getState(key);
                  const isHighVolume = top5Keys.has(key);
                  const isCertifying = certifyingKey === key;
                  return (
                    <motion.tr
                      key={key}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: Math.min(i * 0.02, 0.4),
                        duration: 0.28,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    >
                      <td className="py-2 pr-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                        {c.destination_country}
                      </td>
                      <td className="py-2 pr-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {c.document_type}
                      </td>
                      <td
                        className="py-2 pr-4 font-mono text-sm"
                        style={{ color: "rgba(255,255,255,0.75)" }}
                      >
                        {c.matter_count}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={state}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.28 }}
                            >
                              <StatusBadge status={state} />
                            </motion.div>
                          </AnimatePresence>
                          {isHighVolume && (
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                              style={{
                                background: "rgba(198,165,90,0.08)",
                                border: "1px solid rgba(198,165,90,0.2)",
                                color: GOLD,
                              }}
                            >
                              High Volume
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2">
                        {state !== "Certified" && (
                          <button
                            onClick={() => certify(key)}
                            disabled={!!certifyingKey}
                            className="text-[10px] font-mono px-2 py-1 rounded transition-opacity disabled:opacity-30"
                            style={{
                              background: `${GOLD}15`,
                              border: `1px solid ${GOLD}25`,
                              color: GOLD,
                            }}
                          >
                            {isCertifying ? "Certifying..." : "Certify"}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Italy Node Visualizer */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-6"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Corridor Node Visualizer — Italy Example
        </p>
        <div className="flex flex-col items-start gap-0 max-w-xs">
          {ITALY_NODES.map((node, i) => {
            const isActive = activeNodeIdx >= i;
            return (
              <div key={node} className="flex flex-col items-start">
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="px-4 py-2.5 rounded text-sm"
                  style={{
                    background: isActive ? `${GOLD}0f` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? GOLD + "40" : "rgba(255,255,255,0.08)"}`,
                    color: isActive ? GOLD : "rgba(255,255,255,0.5)",
                    transition: "all 300ms ease",
                  }}
                >
                  {node}
                </motion.div>
                {i < ITALY_NODES.length - 1 && (
                  <div
                    className="w-[1px] h-5 ml-6"
                    style={{
                      background: isActive
                        ? GOLD
                        : "rgba(255,255,255,0.12)",
                      transition: "background 300ms ease",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Certification Targets */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <p
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-4"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Priority Certification Targets
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRIORITY_TARGETS.map((t) => (
            <motion.div
              key={`${t.country}-${t.docType}`}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="p-4 rounded"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{t.flag}</span>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    {t.country}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {t.docType}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-[9px] font-mono"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Research + partner verify
                </span>
                <span
                  className="text-[9px] font-mono px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(198,165,90,0.08)",
                    border: "1px solid rgba(198,165,90,0.2)",
                    color: GOLD,
                  }}
                >
                  Prioritized
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
