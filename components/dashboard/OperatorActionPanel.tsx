"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
} from "lucide-react";
import { QUICK_ACTION_REGISTRY } from "@/lib/dashboard/quickActionRegistry";
import { resolveActions } from "@/lib/dashboard/quickActionRoutes";
import { QuickActionCenter } from "./QuickActionCenter";
import type { QuickActionRole, QuickActionGroup } from "@/lib/dashboard/quickActionTypes";
import type { GuardContext } from "@/lib/dashboard/quickActionGuards";

const EASE = [0.16, 1, 0.3, 1] as const;

const KIND_ICONS: Record<string, string> = {
  REVIEW: "◎", PREPARE: "◈", ROUTE: "→", FLAG: "⚑", LOCKED: "⊠",
};

const GROUP_ORDER: QuickActionGroup[] = [
  "Matter", "Financial", "Execution", "Communications",
  "Documents", "Intelligence", "Courier Custody", "Release",
  "Alliance", "VA", "Admin",
];

export function OperatorActionPanel({
  isOpen,
  onClose,
  matterId,
  role = "founder_admin",
  matterRef,
  matterState,
  paymentStatus,
  releaseStatus,
}: {
  isOpen: boolean;
  onClose: () => void;
  matterId?: string;
  role?: QuickActionRole;
  matterRef?: string;
  matterState?: string;
  paymentStatus?: string;
  releaseStatus?: string;
}) {
  const router = useRouter();
  const [centerOpen, setCenterOpen] = useState(false);

  const ctx: GuardContext & { role: string } = {
    role,
    activeMatterId: matterId,
    matterState,
    paymentStatus,
    releaseStatus,
  };

  // Resolve registry actions — exclude destructive mark_paid_and_released from main panel
  const resolved = resolveActions(
    QUICK_ACTION_REGISTRY.filter(a =>
      a.roles.includes(role) && a.id !== "mark_paid_and_released"
    ),
    ctx
  );

  // Group by category
  const grouped = GROUP_ORDER.map(group => ({
    group,
    actions: resolved.filter(a => a.group === group),
  })).filter(g => g.actions.length > 0);

  return (
    <>
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
                    <Shield className="w-4 h-4" style={{ color: "#D4AF37" }} />
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

              {/* Matter context strip */}
              {matterId && (
                <div className="px-6 py-2 border-b border-[rgba(212,175,55,0.08)]">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="font-mono text-[8px] text-amber-400 tracking-wide uppercase">
                      Active: {matterRef ?? matterId.slice(0, 8).toUpperCase()}
                    </span>
                    {matterState && (
                      <span className="font-mono text-[7px] text-zinc-500 capitalize">{matterState.replace(/_/g, ' ')}</span>
                    )}
                    {paymentStatus && (
                      <span className={`font-mono text-[7px] capitalize ${paymentStatus === 'paid' || paymentStatus === 'payment_confirmed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {paymentStatus.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </div>
              )}

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
                        const isReady = action.resolvedStatus === "READY";
                        const isRelease = action.group === "Release";
                        const kindIcon = KIND_ICONS[action.kind] ?? "·";

                        return (
                          <motion.button
                            key={action.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, ease: EASE, duration: 0.28 }}
                            onClick={() => {
                              if (!isReady) return;
                              router.push(action.resolvedHref);
                              onClose();
                            }}
                            whileHover={isReady ? { y: -1 } : {}}
                            disabled={!isReady}
                            title={!isReady ? action.resolvedReason : undefined}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded text-left transition-all duration-200"
                            style={{
                              background: isRelease ? "rgba(198,165,90,0.04)" : "rgba(255,255,255,0.025)",
                              border: isRelease
                                ? "1px solid rgba(198,165,90,0.18)"
                                : "1px solid rgba(212,175,55,0.1)",
                              opacity: isReady ? 1 : 0.5,
                              cursor: isReady ? "pointer" : "not-allowed",
                            }}
                            onMouseEnter={e => {
                              if (!isReady) return;
                              e.currentTarget.style.background = isRelease ? "rgba(198,165,90,0.09)" : "rgba(212,175,55,0.06)";
                              e.currentTarget.style.borderColor = isRelease ? "rgba(198,165,90,0.4)" : "rgba(212,175,55,0.3)";
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = isRelease ? "rgba(198,165,90,0.04)" : "rgba(255,255,255,0.025)";
                              e.currentTarget.style.borderColor = isRelease ? "rgba(198,165,90,0.18)" : "rgba(212,175,55,0.1)";
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0 font-mono text-sm"
                                style={{
                                  background: "rgba(212,175,55,0.08)",
                                  border: "1px solid rgba(212,175,55,0.2)",
                                  color: "#D4AF37",
                                }}
                              >
                                {kindIcon}
                              </span>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span
                                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                                  style={{ color: "rgba(255,255,255,0.78)" }}
                                >
                                  {action.label}
                                </span>
                                {!isReady && action.resolvedReason && (
                                  <span className="font-mono text-[7px] text-amber-500/60 truncate max-w-[180px]">
                                    {action.resolvedReason}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className="font-mono text-[8px] whitespace-nowrap flex-shrink-0"
                              style={{
                                color: isReady
                                  ? (matterId ? "rgba(198,165,90,0.7)" : "rgba(212,175,55,0.45)")
                                  : "rgba(212,175,55,0.2)",
                              }}
                            >
                              {isReady ? (matterId ? "→ MATTER" : "→") : "⊠"}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex-shrink-0 flex items-center justify-between gap-3" style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}>
                <p
                  className="font-mono text-[8px] tracking-[0.3em] uppercase"
                  style={{ color: "rgba(212,175,55,0.25)" }}
                >
                  The Milano Seal™ · Operator Layer
                </p>
                <button
                  onClick={() => { onClose(); setCenterOpen(true); }}
                  className="font-mono text-[7px] tracking-[0.15em] uppercase px-2 py-1 rounded-sm border transition-colors"
                  style={{
                    color: "rgba(212,175,55,0.6)",
                    borderColor: "rgba(212,175,55,0.2)",
                    background: "rgba(212,175,55,0.04)",
                  }}
                >
                  ⊞ All Actions
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <QuickActionCenter
        isOpen={centerOpen}
        onClose={() => setCenterOpen(false)}
        role={role}
        activeMatterId={matterId}
        matterRef={matterRef}
        matterState={matterState}
        paymentStatus={paymentStatus}
        releaseStatus={releaseStatus}
      />
    </>
  );
}
