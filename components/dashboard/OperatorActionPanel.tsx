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
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const ACTIONS = [
  { label: "CREATE MATTER",         icon: FilePlus2,   route: "/dashboard/intake",  hasHook: true },
  { label: "GENERATE INVOICE",      icon: FileText,    route: null,                 hasHook: false },
  { label: "RUN COMPLIANCE REVIEW", icon: ShieldCheck, route: "/dashboard/tools",   hasHook: true },
  { label: "CREATE COURIER LABEL",  icon: Package,     route: "/dashboard/courier", hasHook: true },
  { label: "SEND CLIENT UPDATE",    icon: Send,        route: null,                 hasHook: false },
  { label: "CREATE LEDGER EVENT",   icon: FileText,    route: null,                 hasHook: false },
  { label: "OPEN DOCUMENT VAULT",   icon: FolderOpen,  route: "/dashboard/sops",    hasHook: true },
  { label: "MARK PAID & RELEASED",  icon: CheckCircle2,route: null,                 hasHook: false },
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.42, ease: EASE }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-[#080808] border-l border-[#1E1E1E] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#1A1A1A]">
              <div>
                <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#6A5520] mb-0.5">
                  Internal Management Layer
                </p>
                <h2 className="font-serif text-lg text-white tracking-wide">
                  Quick Actions
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded text-[#555] hover:text-white hover:bg-[#1A1A1A] transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2">
              {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, ease: EASE, duration: 0.3 }}
                    disabled={!action.hasHook}
                    onClick={() => {
                      if (action.route) {
                        router.push(action.route);
                        onClose();
                      }
                    }}
                    whileHover={action.hasHook ? { y: -1 } : undefined}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded border text-left transition-all duration-200 ${
                      action.hasHook
                        ? "bg-[#0D0D0D] border-[#252525] hover:border-[#C6A55A]/35 hover:bg-[#111]"
                        : "bg-[#080808] border-[#141414] opacity-40 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 flex items-center justify-center rounded border border-[#1E1E1E] bg-[#0A0A0A] flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-[#C6A55A]" />
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#C0C0C0]">
                        {action.label}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-[#4A4A4A] whitespace-nowrap">
                      {action.hasHook ? "→ READY" : "REQUIRES WORKFLOW HOOK"}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#1A1A1A]">
              <p className="font-mono text-[8.5px] tracking-[0.28em] uppercase text-[#3A3A3A] text-center">
                The Milano Seal™ · Operator Layer
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
