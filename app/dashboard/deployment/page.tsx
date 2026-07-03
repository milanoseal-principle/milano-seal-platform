"use client";
import { useState } from 'react';

import { motion } from "framer-motion";

const GOLD = "#C6A55A";
const EMERALD = "#4a9e6b";
const AMBER = "#f59e0b";

type ItemStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE";

interface InfraItem {
  id: string;
  label: string;
  category: string;
}

const INFRA_ITEMS: InfraItem[] = [
  { id: "migration-009", label: "Migration 009", category: "Database" },
  { id: "migration-010", label: "Migration 010", category: "Database" },
  { id: "migration-013", label: "Migration 013", category: "Database" },
  { id: "migration-014", label: "Migration 014", category: "Database" },
  { id: "docs-bucket", label: "Documents Bucket (PRIVATE)", category: "Storage" },
  { id: "portal-secret", label: "PORTAL_SESSION_SECRET", category: "Secrets" },
  { id: "shippo-secret", label: "SHIPPO_WEBHOOK_SECRET", category: "Secrets" },
  { id: "app-url", label: "NEXT_PUBLIC_APP_URL", category: "Config" },
  { id: "pr-61", label: "PR #61 Merged", category: "Deploy" },
  { id: "prod-deploy", label: "Production Deploy", category: "Deploy" },
  { id: "smoke-test", label: "Smoke Test Complete", category: "Deploy" },
];

const SMOKE_ROUTES = [
  "/dashboard",
  "/dashboard/admin",
  "/dashboard/deals",
  "/dashboard/execution-control",
  "/dashboard/releases",
  "/dashboard/rejections",
  "/dashboard/executive",
  "/dashboard/financials",
  "/dashboard/authorities",
  "/dashboard/alliance",
];

function statusColor(status: ItemStatus) {
  if (status === "COMPLETE") return EMERALD;
  if (status === "IN_PROGRESS") return AMBER;
  return "rgba(255,255,255,0.2)";
}

function statusBg(status: ItemStatus) {
  if (status === "COMPLETE") return "rgba(74,158,107,0.12)";
  if (status === "IN_PROGRESS") return "rgba(245,158,11,0.1)";
  return "rgba(255,255,255,0.04)";
}

function nextStatus(s: ItemStatus): ItemStatus {
  if (s === "PENDING") return "IN_PROGRESS";
  if (s === "IN_PROGRESS") return "COMPLETE";
  return "PENDING";
}

export default function DeploymentPage() {
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>(
    Object.fromEntries(INFRA_ITEMS.map((i) => [i.id, "PENDING" as ItemStatus]))
  );
  const [smokeChecked, setSmokeChecked] = useState<Set<string>>(new Set());

  function cycleStatus(id: string) {
    setStatuses((prev) => ({ ...prev, [id]: nextStatus(prev[id]) }));
  }

  function toggleSmoke(route: string) {
    setSmokeChecked((prev) => {
      const next = new Set(prev);
      if (next.has(route)) next.delete(route);
      else next.add(route);
      return next;
    });
  }

  const completeCount = Object.values(statuses).filter(
    (s) => s === "COMPLETE"
  ).length;
  const total = INFRA_ITEMS.length;
  const progressPct = (completeCount / total) * 100;

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
          System / Deployment
        </p>
        <h1 className="text-2xl font-semibold" style={{ color: GOLD }}>
          Deployment Validation Center
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Infrastructure state — operator-confirmed
        </p>
      </div>

      {/* Readiness Score */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="font-mono text-[9px] tracking-[0.32em] uppercase"
            style={{ color: "rgba(198,165,90,0.5)" }}
          >
            Deployment Readiness
          </p>
          <span
            className="font-mono text-sm"
            style={{ color: completeCount === total ? EMERALD : GOLD }}
          >
            {completeCount} / {total} complete
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <motion.div
            className="h-full rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background:
                completeCount === total
                  ? EMERALD
                  : `linear-gradient(90deg, ${GOLD}, ${AMBER})`,
            }}
          />
        </div>
      </div>

      {/* Infrastructure Status Grid */}
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
          Infrastructure Status
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {INFRA_ITEMS.map((item, i) => {
            const status = statuses[item.id];
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onClick={() => cycleStatus(item.id)}
                className="flex items-center justify-between p-3 rounded text-left"
                style={{
                  background: statusBg(status),
                  border: `1px solid ${statusColor(status)}22`,
                  transition: "background 300ms, border-color 300ms",
                }}
                whileHover={{ y: -1 }}
              >
                <div>
                  <p
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-[10px] font-mono mt-0.5"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                  >
                    {item.category}
                  </p>
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded flex-shrink-0"
                  style={{
                    background: statusBg(status),
                    color: statusColor(status),
                    border: `1px solid ${statusColor(status)}44`,
                    transition: "all 300ms",
                  }}
                >
                  {status === "PENDING"
                    ? "PENDING"
                    : status === "IN_PROGRESS"
                    ? "IN PROGRESS"
                    : "COMPLETE"}
                </span>
              </motion.button>
            );
          })}
        </div>
        <p
          className="text-[10px] font-mono mt-4"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Click each item to cycle: PENDING → IN PROGRESS → COMPLETE
        </p>
      </div>

      {/* Smoke Test Checklist */}
      <div
        className="rounded-lg p-6"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <p
            className="font-mono text-[9px] tracking-[0.32em] uppercase"
            style={{ color: "rgba(198,165,90,0.5)" }}
          >
            Smoke Test Checklist
          </p>
          <span
            className="font-mono text-xs"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            {smokeChecked.size} / {SMOKE_ROUTES.length} verified
          </span>
        </div>
        <div className="space-y-1.5">
          {SMOKE_ROUTES.map((route) => {
            const checked = smokeChecked.has(route);
            return (
              <motion.button
                key={route}
                onClick={() => toggleSmoke(route)}
                className="w-full flex items-center gap-3 p-2.5 rounded text-left"
                style={{
                  borderLeft: `3px solid ${checked ? EMERALD : "rgba(255,255,255,0.06)"}`,
                  background: checked
                    ? "rgba(74,158,107,0.04)"
                    : "rgba(255,255,255,0.01)",
                  transition: "all 250ms",
                }}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: checked ? EMERALD : "rgba(255,255,255,0.2)",
                    background: checked ? `${EMERALD}33` : "transparent",
                  }}
                >
                  {checked && (
                    <span style={{ color: EMERALD, fontSize: 10 }}>✓</span>
                  )}
                </div>
                <span
                  className="font-mono text-sm"
                  style={{
                    color: checked
                      ? "rgba(255,255,255,0.35)"
                      : "rgba(255,255,255,0.65)",
                    textDecoration: checked ? "line-through" : "none",
                    transition: "all 250ms",
                  }}
                >
                  {route}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Operator Note */}
      <div
        className="rounded-lg p-4"
        style={{
          background: "rgba(198,165,90,0.04)",
          border: "1px solid rgba(198,165,90,0.12)",
        }}
      >
        <p className="text-xs font-mono" style={{ color: "rgba(198,165,90,0.7)" }}>
          Deployment state is operator-confirmed. This panel reflects the state
          you have manually verified. No automated environment detection.
        </p>
      </div>
    </motion.div>
  );
}
