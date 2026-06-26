"use client";

import { CheckCircle2, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  payment_status: string | null;
  balance_due?: number;
  paid_and_released?: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function PaymentGatePanel({ payment_status, balance_due, paid_and_released }: Props) {
  const isConfirmed =
    payment_status === "payment_confirmed" || payment_status === "paid";

  if (paid_and_released) {
    return (
      <motion.div
        data-critical-card=""
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{
          background: "rgba(34,197,94,0.04)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "2px",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(34,197,94,0.8)" }} />
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "rgba(34,197,94,0.9)" }}
            >
              Matter Released
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(34,197,94,0.5)" }}
            >
              Final invoice and document vault access active
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isConfirmed && (balance_due === 0 || balance_due == null)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        data-critical-card=""
        style={{
          background: "rgba(34,197,94,0.03)",
          border: "1px solid rgba(34,197,94,0.15)",
          borderRadius: "2px",
          padding: "1.25rem 1.5rem",
        }}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(34,197,94,0.7)" }} />
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "rgba(34,197,94,0.85)" }}
            >
              Payment Confirmed
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(34,197,94,0.45)" }}
            >
              Scheduling and execution authorized
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Locked
  return (
    <motion.div
      data-critical-card=""
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{
        background: "rgba(245,158,11,0.04)",
        border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: "2px",
        padding: "1.25rem 1.5rem",
      }}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Lock className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(245,158,11,0.8)" }} />
        </motion.div>
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "rgba(245,158,11,0.9)" }}
          >
            Scheduling Locked
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "rgba(245,158,11,0.5)" }}
          >
            Balance Outstanding — Payment required before scheduling
          </p>
        </div>
      </div>
    </motion.div>
  );
}
