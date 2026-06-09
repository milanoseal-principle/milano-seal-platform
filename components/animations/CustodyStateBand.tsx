"use client";

import { motion, useReducedMotion } from "framer-motion";

const STATE_MAP: Record<string, { label: string; color: string; bg: string; sweep?: boolean }> = {
  label_created: { label: "LABEL CREATED", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  picked_up: { label: "PICKED UP", color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  in_transit: { label: "IN TRANSIT", color: "#D4AF37", bg: "rgba(212,175,55,0.15)", sweep: true },
  out_for_delivery: { label: "OUT FOR DELIVERY", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  delivered: { label: "DELIVERED", color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  delivered_not_released: { label: "DELIVERED · PENDING RELEASE", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  exception: { label: "EXCEPTION", color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

export interface CustodyStateBandProps {
  status: string;
  trackingNumber?: string;
  trackingDisplay?: string;
  carrier?: string;
  estimatedDelivery?: string;
}

export function CustodyStateBand({ status, trackingNumber, carrier }: CustodyStateBandProps) {
  const reduced = useReducedMotion();
  const mapping = STATE_MAP[status] ?? {
    label: status.toUpperCase().replace(/_/g, " "),
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
  };

  return (
    <div
      className="relative w-full overflow-hidden flex items-center justify-between px-4 py-2"
      style={{
        background: mapping.bg,
        borderTop: `1px solid ${mapping.color}30`,
        borderBottom: `1px solid ${mapping.color}30`,
      }}
    >
      {/* Sweep overlay for in_transit */}
      {mapping.sweep && !reduced && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.15) 50%, transparent 100%)`,
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
        />
      )}

      <span
        className="font-mono text-[10px] tracking-widest uppercase relative z-10"
        style={{ color: mapping.color }}
      >
        {mapping.label}
      </span>

      <div className="flex items-center gap-3 relative z-10">
        {carrier && (
          <span className="font-mono text-[9px] tracking-wider uppercase text-[#94a3b8]">
            {carrier}
          </span>
        )}
        {trackingNumber && (
          <span className="font-mono text-[9px] tracking-wider text-[#94a3b8]">
            {trackingNumber}
          </span>
        )}
      </div>
    </div>
  );
}
