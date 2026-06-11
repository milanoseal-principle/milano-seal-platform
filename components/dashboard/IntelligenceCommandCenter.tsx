"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import {
  CalendarClock,
  Truck,
  DollarSign,
  Stamp,
  PackageOpen,
  AlertTriangle,
} from "lucide-react";

interface IntelligenceData {
  today_executions: number;
  courier_exceptions: number;
  awaiting_payment: number;
  awaiting_apostille: number;
  awaiting_release: number;
  high_priority: number;
  errors?: Record<string, boolean>;
}

const GOLD = "#C6A55A";
const EASE = [0.16, 1, 0.3, 1] as const;

interface CardDef {
  key: keyof Omit<IntelligenceData, "errors">;
  label: string;
  icon: React.ElementType;
  critical?: boolean;
}

const CARDS: CardDef[] = [
  { key: "today_executions", label: "Today's Executions", icon: CalendarClock },
  { key: "courier_exceptions", label: "Courier Exceptions", icon: Truck, critical: true },
  { key: "awaiting_payment", label: "Awaiting Payment", icon: DollarSign, critical: true },
  { key: "awaiting_apostille", label: "Awaiting Apostille", icon: Stamp },
  { key: "awaiting_release", label: "Awaiting Release", icon: PackageOpen },
  { key: "high_priority", label: "High Priority", icon: AlertTriangle, critical: true },
];

function IntelCard({
  label,
  value,
  icon: Icon,
  critical,
  hasError,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  critical?: boolean;
  hasError?: boolean;
  delay: number;
}) {
  const isFlagged = critical && value > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay }}
      whileHover={{ y: -2 }}
      style={{
        background: isFlagged
          ? "rgba(245,158,11,0.04)"
          : "rgba(198,165,90,0.03)",
        border: `1px solid ${
          isFlagged ? "rgba(245,158,11,0.25)" : "rgba(198,165,90,0.15)"
        }`,
        borderRadius: "2px",
        padding: "1.25rem",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[9px] font-mono uppercase tracking-[0.2em]"
          style={{ color: isFlagged ? "#f59e0b" : "rgba(198,165,90,0.6)" }}
        >
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {hasError && (
            <span
              className="text-[7px] font-mono uppercase"
              style={{ color: "rgba(239,68,68,0.5)" }}
            >
              data err
            </span>
          )}
          {isFlagged ? (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className="w-4 h-4" style={{ color: "#f59e0b" }} />
            </motion.div>
          ) : (
            <Icon className="w-4 h-4" style={{ color: GOLD }} />
          )}
        </div>
      </div>
      <motion.div
        className="text-4xl font-light leading-none"
        style={{
          fontFamily: "var(--font-playfair), Georgia, serif",
          color: isFlagged ? "#f59e0b" : GOLD,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.15 }}
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

export function IntelligenceCommandCenter() {
  const { data, isLoading, isError } = useApi<IntelligenceData>(
    "/api/dashboard/intelligence"
  );

  const vals: Omit<IntelligenceData, "errors"> = data ?? {
    today_executions: 0,
    courier_exceptions: 0,
    awaiting_payment: 0,
    awaiting_apostille: 0,
    awaiting_release: 0,
    high_priority: 0,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p
            className="text-[9px] font-mono uppercase tracking-[0.28em] mb-1"
            style={{ color: "rgba(198,165,90,0.5)" }}
          >
            Execution Center
          </p>
          <h2
            className="font-serif text-xl font-light"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Execution Intelligence
          </h2>
        </div>
        {isError && (
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: "rgba(239,68,68,0.5)" }}
          >
            Connection error
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {CARDS.map((c) => (
            <div
              key={c.key}
              style={{
                background: "rgba(198,165,90,0.03)",
                border: "1px solid rgba(198,165,90,0.08)",
                borderRadius: "2px",
                padding: "1.25rem",
                minHeight: 90,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <IntelCard
              key={c.key}
              label={c.label}
              value={vals[c.key]}
              icon={c.icon}
              critical={c.critical}
              hasError={data?.errors?.[c.key]}
              delay={i * 0.07}
            />
          ))}
        </div>
      )}
    </div>
  );
}
