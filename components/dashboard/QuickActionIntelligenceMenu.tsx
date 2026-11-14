"use client";

/**
 * QuickActionIntelligenceMenu
 *
 * Wraps OperatorActionPanel with live badge status indicators sourced from
 * /api/dashboard/quick-actions. Badge states: REVIEW_REQUIRED (amber pulse),
 * BLOCKED (red border + lock), COMPLETE (muted green), NO_DATA/DISABLED (muted),
 * READY (gold hover edge only).
 *
 * Uses prefers-reduced-motion to disable animations for accessibility.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FilePlus2,
  FileText,
  ShieldCheck,
  Package,
  Send,
  BookOpen,
  FolderOpen,
  Unlock,
  X,
  Shield,
  Sparkles,
  GitBranch,
  Users,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickActionSummary {
  actionRequiredCount: number;
  deliveredNotReleasedCount: number;
  // Null when the VA task ledger is unavailable: no badge is shown, never a false zero.
  vaTaskCount: number | null;
  overdueVaTaskCount: number | null;
  reviewRequiredCount: number;
  blockedCount: number;
}

type BadgeVariant =
  | "amber-action"
  | "amber-pulse"
  | "red-overdue"
  | "red-blocked"
  | "gold"
  | "green-complete"
  | null;

interface BadgeConfig {
  variant: BadgeVariant;
  label: string;
  count?: number;
  /** Show left red border (BLOCKED state) */
  borderLeft?: boolean;
  /** Reduce opacity (NO_DATA / DISABLED) */
  muted?: boolean;
}

// ─── Hook: prefers-reduced-motion ─────────────────────────────────────────────

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const EASE = [0.16, 1, 0.3, 1] as const;

interface Action {
  label: string;
  icon: React.ElementType;
  route: string;
  matterParam?: string;
  group: string;
  danger?: boolean;
  /** Key used to look up badge logic */
  badgeKey?: string;
}

const ACTIONS: Action[] = [
  { label: "CREATE MATTER",         icon: FilePlus2,   route: "/dashboard/intake",            group: "MATTER" },
  { label: "SMART INTAKE",          icon: Sparkles,    route: "/dashboard/intake",            matterParam: "mode=smart", group: "MATTER" },

  { label: "PAYMENT GATE",          icon: FileText,    route: "/dashboard/invoices/new",      matterParam: "matter_id", group: "FINANCIAL", badgeKey: "paymentGate" },

  { label: "RUN COMPLIANCE REVIEW", icon: ShieldCheck, route: "/dashboard/compliance",        matterParam: "matter_id", group: "EXECUTION" },
  { label: "DELIVERED NOT RELEASED",icon: Package,     route: "/dashboard/shipping",          matterParam: "matter_id", group: "EXECUTION", badgeKey: "deliveredNotReleased" },

  { label: "SEND CLIENT UPDATE",    icon: Send,        route: "/dashboard/communications",    matterParam: "matter_id", group: "COMMS" },
  { label: "SEND PARTNER UPDATE",   icon: Users,       route: "/dashboard/alliance",          group: "COMMS" },

  { label: "OPEN DOCUMENT VAULT",   icon: FolderOpen,  route: "/dashboard/documents",         matterParam: "matter_id", group: "DOCUMENTS" },
  { label: "CREATE LEDGER EVENT",   icon: BookOpen,    route: "/dashboard/terminal/new",      matterParam: "matter_id", group: "DOCUMENTS" },

  { label: "RUN COPILOT",           icon: GitBranch,   route: "/dashboard/copilot",           group: "INTELLIGENCE" },
  { label: "VA TASK QUEUE",         icon: ShieldCheck, route: "/dashboard/va-tasks",          group: "INTELLIGENCE", badgeKey: "vaTaskQueue" },

  { label: "REVIEW ACTIVE MATTER",  icon: Unlock,      route: "/dashboard/releases",          matterParam: "matter_id", group: "RELEASE", badgeKey: "reviewActiveMatter" },
  { label: "OPERATIONS DESK",       icon: Shield,      route: "/dashboard/operations",        group: "RELEASE", badgeKey: "operationsDesk" },
];

const GROUP_ORDER = ["MATTER", "FINANCIAL", "EXECUTION", "COMMS", "DOCUMENTS", "INTELLIGENCE", "RELEASE"];

// ─── Badge computation ────────────────────────────────────────────────────────

function computeBadge(
  badgeKey: string | undefined,
  summary: QuickActionSummary | null
): BadgeConfig | null {
  if (!badgeKey || !summary) return null;

  switch (badgeKey) {
    case "paymentGate":
      if (summary.actionRequiredCount > 0) {
        return {
          variant: "amber-action",
          label: "ACTION REQUIRED",
          count: summary.actionRequiredCount,
        };
      }
      return null;

    case "deliveredNotReleased":
      if (summary.deliveredNotReleasedCount > 0) {
        return {
          variant: "amber-pulse",
          label: "PENDING RELEASE",
          count: summary.deliveredNotReleasedCount,
        };
      }
      return null;

    case "vaTaskQueue":
      if ((summary.overdueVaTaskCount ?? 0) > 0) {
        return {
          variant: "red-overdue",
          label: "OVERDUE",
          count: summary.overdueVaTaskCount ?? 0,
        };
      }
      if ((summary.vaTaskCount ?? 0) > 0) {
        return {
          variant: "gold",
          label: "TASKS",
          count: summary.vaTaskCount ?? 0,
        };
      }
      return null;

    case "reviewActiveMatter":
      if (summary.reviewRequiredCount > 0) {
        return {
          variant: "amber-action",
          label: "REVIEW REQUIRED",
          count: summary.reviewRequiredCount,
        };
      }
      return null;

    case "operationsDesk":
      if (summary.blockedCount > 0) {
        return {
          variant: "red-blocked",
          label: "BLOCKED",
          count: summary.blockedCount,
          borderLeft: true,
        };
      }
      return null;

    default:
      return null;
  }
}

// ─── Badge pill component ──────────────────────────────────────────────────────

function BadgePill({
  badge,
  reducedMotion,
}: {
  badge: BadgeConfig;
  reducedMotion: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 6px",
    borderRadius: "3px",
    fontFamily: "monospace",
    fontSize: "7px",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: "nowrap",
  };

  switch (badge.variant) {
    case "amber-action":
      return (
        <span
          style={{
            ...baseStyle,
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.4)",
            color: "rgba(245,158,11,0.9)",
          }}
        >
          <AlertTriangle style={{ width: 7, height: 7 }} />
          {badge.label}
          {badge.count !== undefined && ` · ${badge.count}`}
        </span>
      );

    case "amber-pulse":
      return (
        <span
          style={{
            ...baseStyle,
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.4)",
            color: "rgba(245,158,11,0.9)",
            animation: reducedMotion
              ? "none"
              : "qai-amber-pulse 1800ms ease-in-out infinite",
          }}
        >
          <AlertTriangle style={{ width: 7, height: 7 }} />
          {badge.label}
          {badge.count !== undefined && ` · ${badge.count}`}
        </span>
      );

    case "red-overdue":
      return (
        <span
          style={{
            ...baseStyle,
            background: "rgba(239,68,68,0.15)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "rgba(239,68,68,0.9)",
          }}
        >
          {badge.label}
          {badge.count !== undefined && ` · ${badge.count}`}
        </span>
      );

    case "red-blocked":
      return (
        <span
          style={{
            ...baseStyle,
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "rgba(239,68,68,0.85)",
          }}
        >
          <Lock style={{ width: 7, height: 7 }} />
          {badge.label}
          {badge.count !== undefined && ` · ${badge.count}`}
        </span>
      );

    case "gold":
      return (
        <span
          style={{
            ...baseStyle,
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.3)",
            color: "rgba(212,175,55,0.85)",
          }}
        >
          {badge.label}
          {badge.count !== undefined && ` · ${badge.count}`}
        </span>
      );

    case "green-complete":
      return (
        <span
          style={{
            ...baseStyle,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
            color: "rgba(34,197,94,0.75)",
          }}
        >
          <CheckCircle2 style={{ width: 7, height: 7 }} />
          {badge.label}
        </span>
      );

    default:
      return null;
  }
}

// ─── Main component ────────────────────────────────────────────────────────────

export function QuickActionIntelligenceMenu({
  isOpen,
  onClose,
  matterId,
}: {
  isOpen: boolean;
  onClose: () => void;
  matterId?: string;
}) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [summary, setSummary] = useState<QuickActionSummary | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isOpen || fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/dashboard/quick-actions")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.summary) setSummary(data.summary);
      })
      .catch(() => {
        // Non-critical — badges won't show but panel still works
      });
  }, [isOpen]);

  function buildRoute(action: Action): string {
    if (!action.matterParam) return action.route;
    if (action.matterParam === "mode=smart") return `${action.route}?mode=smart`;
    if (matterId) return `${action.route}?${action.matterParam}=${matterId}`;
    return action.route;
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    actions: ACTIONS.filter((a) => a.group === group),
  }));

  return (
    <>
      {/* Pulse keyframe injected once */}
      <style>{`
        @keyframes qai-amber-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); opacity: 1; }
          50% { box-shadow: 0 0 0 3px rgba(245,158,11,0.25); opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .qai-pulse { animation: none !important; }
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(3px)" }}
              onClick={onClose}
            />

            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.42, ease: EASE }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm flex flex-col"
              style={{
                background: "rgba(6,4,2,0.98)",
                borderLeft: "1px solid rgba(212,175,55,0.14)",
                boxShadow: "-20px 0 60px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(212,175,55,0.04)",
              }}
            >
              {/* Header */}
              <div
                className="relative flex items-center justify-between px-6 py-5 flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.04) 60%, rgba(0,0,0,0) 100%)",
                  borderBottom: "1px solid rgba(212,175,55,0.12)",
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)" }}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 flex items-center justify-center rounded flex-shrink-0"
                    style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.22)" }}
                  >
                    <Shield className="w-4.5 h-4.5" style={{ color: "#D4AF37" }} />
                  </div>
                  <div>
                    <p className="font-mono text-[8.5px] tracking-[0.32em] uppercase" style={{ color: "rgba(212,175,55,0.55)" }}>
                      {matterId ? `Matter · ${matterId.slice(0, 8).toUpperCase()}` : "Internal Management Layer"}
                    </p>
                    <h2 className="font-serif text-base text-white tracking-wide leading-tight mt-0.5">
                      Quick Actions
                    </h2>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action list */}
              <div className="flex-1 overflow-y-auto px-4 pb-5 pt-3" style={{ scrollbarWidth: "none" }}>
                {grouped.map(({ group, actions }) => (
                  <div key={group} className="mb-4">
                    <span
                      className="font-mono text-[7.5px] tracking-[0.3em] uppercase px-1 pb-1 block"
                      style={{ color: "rgba(212,175,55,0.3)" }}
                    >
                      {group}
                    </span>
                    <div className="space-y-1">
                      {actions.map((action, i) => {
                        const Icon = action.icon;
                        const route = buildRoute(action);
                        const isRelease = action.group === "RELEASE";
                        const badge = computeBadge(action.badgeKey, summary);
                        const isBlocked = badge?.variant === "red-blocked";
                        const isMuted = badge?.muted === true;

                        return (
                          <motion.button
                            key={action.label}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: isMuted ? 0.5 : 1, y: 0 }}
                            transition={{ delay: i * 0.03, ease: EASE, duration: 0.28 }}
                            onClick={() => { router.push(route); onClose(); }}
                            whileHover={{ y: -1 }}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded text-left transition-all duration-200"
                            style={{
                              background: isRelease ? "rgba(198,165,90,0.04)" : "rgba(255,255,255,0.025)",
                              border: isBlocked
                                ? "1px solid rgba(239,68,68,0.25)"
                                : isRelease
                                  ? "1px solid rgba(198,165,90,0.18)"
                                  : "1px solid rgba(212,175,55,0.1)",
                              borderLeft: isBlocked
                                ? "3px solid rgba(239,68,68,0.7)"
                                : undefined,
                            }}
                            onMouseEnter={e => {
                              if (!isBlocked) {
                                e.currentTarget.style.background = isRelease
                                  ? "rgba(198,165,90,0.09)"
                                  : "rgba(212,175,55,0.06)";
                                e.currentTarget.style.borderColor = isRelease
                                  ? "rgba(198,165,90,0.4)"
                                  : "rgba(212,175,55,0.3)";
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isBlocked) {
                                e.currentTarget.style.background = isRelease
                                  ? "rgba(198,165,90,0.04)"
                                  : "rgba(255,255,255,0.025)";
                                e.currentTarget.style.borderColor = isRelease
                                  ? "rgba(198,165,90,0.18)"
                                  : "rgba(212,175,55,0.1)";
                              }
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
                                style={{
                                  background: isBlocked
                                    ? "rgba(239,68,68,0.08)"
                                    : "rgba(212,175,55,0.08)",
                                  border: isBlocked
                                    ? "1px solid rgba(239,68,68,0.2)"
                                    : "1px solid rgba(212,175,55,0.2)",
                                }}
                              >
                                {isBlocked
                                  ? <Lock className="w-3.5 h-3.5" style={{ color: "rgba(239,68,68,0.7)" }} />
                                  : <Icon className="w-3.5 h-3.5" style={{ color: isMuted ? "rgba(212,175,55,0.4)" : "#D4AF37" }} />
                                }
                              </span>
                              <span
                                className="font-mono text-[10px] tracking-[0.2em] uppercase truncate"
                                style={{ color: isMuted ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.78)" }}
                              >
                                {action.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {badge && (
                                <BadgePill badge={badge} reducedMotion={reducedMotion} />
                              )}
                              {!badge && (
                                <span
                                  className="font-mono text-[8px] whitespace-nowrap"
                                  style={{ color: matterId && action.matterParam === "matter_id" ? "rgba(198,165,90,0.7)" : "rgba(212,175,55,0.45)" }}
                                >
                                  {matterId && action.matterParam === "matter_id" ? "→ MATTER" : "→"}
                                </span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}>
                <p
                  className="font-mono text-[8px] tracking-[0.3em] uppercase text-center"
                  style={{ color: "rgba(212,175,55,0.25)" }}
                >
                  The Milano Seal™ · Intelligence Layer
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
