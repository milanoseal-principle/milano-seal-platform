"use client";

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
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Action {
  label: string;
  icon: React.ElementType;
  route: string;
  matterParam?: string; // query param key to append when matterId is present
  group: string;
  danger?: boolean;
}

const ACTIONS: Action[] = [
  // Matter Control
  { label: "CREATE MATTER",        icon: FilePlus2,   route: "/dashboard/intake",            group: "MATTER" },
  { label: "SMART INTAKE",         icon: Sparkles,    route: "/dashboard/intake",            matterParam: "mode=smart", group: "MATTER" },

  // Financial
  { label: "GENERATE INVOICE",     icon: FileText,    route: "/dashboard/invoices/new",      matterParam: "matter_id", group: "FINANCIAL" },

  // Execution
  { label: "RUN COMPLIANCE REVIEW",icon: ShieldCheck, route: "/dashboard/compliance",        matterParam: "matter_id", group: "EXECUTION" },
  { label: "CREATE COURIER LABEL", icon: Package,     route: "/dashboard/shipping",          matterParam: "matter_id", group: "EXECUTION" },

  // Communication
  { label: "SEND CLIENT UPDATE",   icon: Send,        route: "/dashboard/communications",    matterParam: "matter_id", group: "COMMS" },
  { label: "SEND PARTNER UPDATE",  icon: Users,       route: "/dashboard/alliance",          group: "COMMS" },

  // Documents
  { label: "OPEN DOCUMENT VAULT",  icon: FolderOpen,  route: "/dashboard/documents",         matterParam: "matter_id", group: "DOCUMENTS" },
  { label: "CREATE LEDGER EVENT",  icon: BookOpen,    route: "/dashboard/terminal/new",      matterParam: "matter_id", group: "DOCUMENTS" },

  // Intelligence
  { label: "RUN COPILOT",          icon: GitBranch,   route: "/dashboard/copilot",           group: "INTELLIGENCE" },

  // Release — requires operator review workflow, not one-click action
  { label: "RELEASE REVIEW",       icon: Unlock,      route: "/dashboard/releases",          matterParam: "matter_id", group: "RELEASE", danger: false },
];

const GROUP_ORDER = ["MATTER", "FINANCIAL", "EXECUTION", "COMMS", "DOCUMENTS", "INTELLIGENCE", "RELEASE"];

export function OperatorActionPanel({
  isOpen,
  onClose,
  matterId,
}: {
  isOpen: boolean;
  onClose: () => void;
  matterId?: string;
}) {
  const router = useRouter();

  function buildRoute(action: Action): string {
    if (!action.matterParam) return action.route;
    // Smart intake uses mode=smart directly
    if (action.matterParam === "mode=smart") return `${action.route}?mode=smart`;
    // All others append matter_id if present
    if (matterId) return `${action.route}?${action.matterParam}=${matterId}`;
    return action.route;
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    actions: ACTIONS.filter((a) => a.group === group),
  }));

  return (
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
                      return (
                        <motion.button
                          key={action.label}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, ease: EASE, duration: 0.28 }}
                          onClick={() => { router.push(route); onClose(); }}
                          whileHover={{ y: -1 }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded text-left transition-all duration-200"
                          style={{
                            background: isRelease ? "rgba(198,165,90,0.04)" : "rgba(255,255,255,0.025)",
                            border: isRelease
                              ? "1px solid rgba(198,165,90,0.18)"
                              : "1px solid rgba(212,175,55,0.1)",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = isRelease
                              ? "rgba(198,165,90,0.09)"
                              : "rgba(212,175,55,0.06)";
                            e.currentTarget.style.borderColor = isRelease
                              ? "rgba(198,165,90,0.4)"
                              : "rgba(212,175,55,0.3)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = isRelease
                              ? "rgba(198,165,90,0.04)"
                              : "rgba(255,255,255,0.025)";
                            e.currentTarget.style.borderColor = isRelease
                              ? "rgba(198,165,90,0.18)"
                              : "rgba(212,175,55,0.1)";
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
                              style={{
                                background: "rgba(212,175,55,0.08)",
                                border: "1px solid rgba(212,175,55,0.2)",
                              }}
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color: "#D4AF37" }} />
                            </span>
                            <span
                              className="font-mono text-[10px] tracking-[0.2em] uppercase"
                              style={{ color: "rgba(255,255,255,0.78)" }}
                            >
                              {action.label}
                            </span>
                          </div>
                          <span
                            className="font-mono text-[8px] whitespace-nowrap flex-shrink-0"
                            style={{ color: matterId && action.matterParam === "matter_id" ? "rgba(198,165,90,0.7)" : "rgba(212,175,55,0.45)" }}
                          >
                            {matterId && action.matterParam === "matter_id" ? "→ MATTER" : "→"}
                          </span>
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
                The Milano Seal™ · Operator Layer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
