"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ArrowRight,
  CheckSquare,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";

export interface CustodyStateBandProps {
  status:
    | "in_transit"
    | "delivered"
    | "delivered_not_released"
    | "released"
    | "exception"
    | "label_purchased"
    | "ready_for_courier";
  carrier?: string;
  trackingDisplay?: string;
  estimatedDelivery?: string | null;
}

interface BandConfig {
  label: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  color: string;
  leftAccentColor?: string;
  sweep?: boolean;
  staticGlow?: boolean;
}

function getBandConfig(status: CustodyStateBandProps["status"]): BandConfig {
  switch (status) {
    case "label_purchased":
      return {
        label: "Label Purchased",
        icon: <Package size={14} strokeWidth={1.8} />,
        bg: "rgba(30,34,45,0.85)",
        border: "rgba(100,116,139,0.3)",
        color: "#94A3B8",
      };
    case "ready_for_courier":
      return {
        label: "Ready for Pickup",
        icon: <Package size={14} strokeWidth={1.8} />,
        bg: "rgba(197,160,89,0.08)",
        border: "rgba(197,160,89,0.35)",
        color: "#C5A059",
      };
    case "in_transit":
      return {
        label: "In Transit",
        icon: <ArrowRight size={14} strokeWidth={1.8} />,
        bg: "rgba(71,100,140,0.10)",
        border: "rgba(71,100,140,0.4)",
        color: "#7FAFD4",
        leftAccentColor: "#7FAFD4",
        sweep: true,
      };
    case "delivered":
      return {
        label: "Delivered · Awaiting Release Review",
        icon: <CheckSquare size={14} strokeWidth={1.8} />,
        bg: "rgba(217,119,6,0.10)",
        border: "rgba(217,119,6,0.4)",
        color: "#D97706",
      };
    case "delivered_not_released":
      return {
        label: "Delivered · Release Review Required",
        icon: <Lock size={14} strokeWidth={1.8} />,
        bg: "rgba(217,119,6,0.10)",
        border: "rgba(217,119,6,0.5)",
        color: "#D97706",
        leftAccentColor: "#D97706",
        staticGlow: true,
      };
    case "released":
      return {
        label: "Released & Delivered",
        icon: <Unlock size={14} strokeWidth={1.8} />,
        bg: "rgba(63,164,122,0.10)",
        border: "rgba(63,164,122,0.4)",
        color: "#3FA47A",
      };
    case "exception":
      return {
        label: "Courier Exception · Review Required",
        icon: <AlertTriangle size={14} strokeWidth={1.8} />,
        bg: "rgba(220,38,38,0.10)",
        border: "rgba(220,38,38,0.4)",
        color: "#DC2626",
        leftAccentColor: "#DC2626",
      };
  }
}

export function CustodyStateBand({
  status,
  carrier,
  trackingDisplay,
  estimatedDelivery,
}: CustodyStateBandProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sweepDone, setSweepDone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    setSweepDone(false);
    if (!reducedMotion && status === "in_transit") {
      const t = setTimeout(() => setSweepDone(true), 700);
      return () => clearTimeout(t);
    }
  }, [status, reducedMotion]);

  const cfg = getBandConfig(status);
  const shouldAnimate = !reducedMotion;

  const bandStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: "52px",
    padding: "0 14px",
    borderRadius: "8px",
    border: `1px solid ${cfg.border}`,
    background: cfg.bg,
    overflow: "hidden",
    boxSizing: "border-box",
    borderLeft: cfg.leftAccentColor
      ? `3px solid ${cfg.leftAccentColor}`
      : undefined,
    boxShadow: cfg.staticGlow
      ? `inset 0 0 0 1px rgba(217,119,6,0.25), 0 0 12px rgba(217,119,6,0.08)`
      : undefined,
  };

  return (
    <motion.div
      style={bandStyle}
      initial={shouldAnimate ? { opacity: 0, y: 4 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldAnimate ? 0.3 : 0, ease: "easeOut" }}
    >
      {/* In-transit single sweep overlay */}
      {cfg.sweep && shouldAnimate && !sweepDone && (
        <motion.div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "40%",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(127,175,212,0.18) 50%, transparent 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
          initial={{ x: "-100%" }}
          animate={{ x: "300%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      )}

      {/* Left: icon + label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: cfg.color,
          minWidth: 0,
          zIndex: 2,
        }}
      >
        <span style={{ flexShrink: 0, display: "flex" }}>{cfg.icon}</span>
        <span
          style={{
            fontSize: "12px",
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            fontWeight: 500,
            letterSpacing: "0.02em",
            color: cfg.color,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Center: carrier + tracking */}
      {(carrier || trackingDisplay) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "rgba(255,255,255,0.4)",
            fontSize: "10px",
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            letterSpacing: "0.04em",
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          {carrier && (
            <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
              {carrier}
            </span>
          )}
          {trackingDisplay && <span>{trackingDisplay}</span>}
        </div>
      )}

      {/* Right: estimated delivery */}
      {estimatedDelivery && (
        <div
          style={{
            fontSize: "10px",
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.03em",
            flexShrink: 0,
            zIndex: 2,
          }}
        >
          ETA {estimatedDelivery}
        </div>
      )}
    </motion.div>
  );
}
