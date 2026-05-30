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
  CheckCircle2,
  X,
  Shield,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const ACTIONS = [
  { label: "CREATE MATTER",         icon: FilePlus2,    route: "/dashboard/intake",  hasHook: true },
  { label: "GENERATE INVOICE",      icon: FileText,     route: null,                 hasHook: false },
  { label: "RUN COMPLIANCE REVIEW", icon: ShieldCheck,  route: "/dashboard/tools",   hasHook: true },
  { label: "CREATE COURIER LABEL",  icon: Package,      route: "/dashboard/courier", hasHook: true },
  { label: "SEND CLIENT UPDATE",    icon: Send,         route: null,                 hasHook: false },
  { label: "CREATE LEDGER EVENT",   icon: BookOpen,     route: null,                 hasHook: false },
  { label: "OPEN DOCUMENT VAULT",   icon: FolderOpen,   route: "/dashboard/sops",    hasHook: true },
  { label: "MARK PAID & RELEASED",  icon: CheckCircle2, route: null,                 hasHook: false },
] as const;

export function OperatorActionPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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

          {/* Drawer */}
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
            {/* Gold gradient header */}
            <div
              className="relative flex items-center justify-between px-6 py-5 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.04) 60%, rgba(0,0,0,0) 100%)",
                borderBottom: "1px solid rgba(212,175,55,0.12)",
              }}
            >
              {/* Gold shimmer line */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)" }}
              />

              <div className="flex items-center gap-3">
                {/* Shield icon */}
                <div
                  className="w-9 h-9 flex items-center justify-center rounded flex-shrink-0"
                  style={{
                    background: "rgba(212,175,55,0.08)",
                    border: "1px solid rgba(212,175,55,0.22)",
                  }}
                >
                  <Shield className="w-4.5 h-4.5" style={{ color: "#D4AF37" }} />
                </div>
                <div>
                  <p className="font-mono text-[8.5px] tracking-[0.32em] uppercase" style={{ color: "rgba(212,175,55,0.55)" }}>
                    Internal Management Layer
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

            {/* Section label */}
            <div className="px-6 pt-4 pb-2 flex-shrink-0">
              <span
                className="font-mono text-[8px] tracking-[0.28em] uppercase"
                style={{ color: "rgba(212,175,55,0.35)" }}
              >
                Operator Actions
              </span>
            </div>

            {/* Action tiles grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-5" style={{ scrollbarWidth: "none" }}>
              <div className="space-y-1.5">
                {ACTIONS.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.038, ease: EASE, duration: 0.32 }}
                      disabled={!action.hasHook}
                      onClick={() => {
                        if (action.route) {
                          router.push(action.route);
                          onClose();
                        }
                      }}
                      whileHover={action.hasHook ? { y: -1 } : undefined}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded text-left transition-all duration-200"
                      style={
                        action.hasHook
                          ? {
                              background: "rgba(255,255,255,0.025)",
                              border: "1px solid rgba(212,175,55,0.1)",
                            }
                          : {
                              background: "rgba(255,255,255,0.01)",
                              border: "1px solid rgba(255,255,255,0.04)",
                              opacity: 0.4,
                              cursor: "not-allowed",
                            }
                      }
                      onMouseEnter={e => {
                        if (!action.hasHook) return;
                        const el = e.currentTarget;
                        el.style.background = "rgba(212,175,55,0.06)";
                        el.style.borderColor = "rgba(212,175,55,0.3)";
                      }}
                      onMouseLeave={e => {
                        if (!action.hasHook) return;
                        const el = e.currentTarget;
                        el.style.background = "rgba(255,255,255,0.025)";
                        el.style.borderColor = "rgba(212,175,55,0.1)";
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon box */}
                        <span
                          className="w-8 h-8 flex items-center justify-center rounded flex-shrink-0"
                          style={{
                            background: action.hasHook
                              ? "rgba(212,175,55,0.08)"
                              : "rgba(255,255,255,0.03)",
                            border: action.hasHook
                              ? "1px solid rgba(212,175,55,0.2)"
                              : "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: action.hasHook ? "#D4AF37" : "rgba(255,255,255,0.25)" }}
                          />
                        </span>
                        {/* Label */}
                        <span
                          className="font-mono text-[10px] tracking-[0.2em] uppercase"
                          style={{ color: action.hasHook ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.3)" }}
                        >
                          {action.label}
                        </span>
                      </div>
                      {/* Route status */}
                      <span
                        className="font-mono text-[8.5px] whitespace-nowrap flex-shrink-0"
                        style={{ color: action.hasHook ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.2)" }}
                      >
                        {action.hasHook ? "→ READY" : "PENDING"}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 flex-shrink-0"
              style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}
            >
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
