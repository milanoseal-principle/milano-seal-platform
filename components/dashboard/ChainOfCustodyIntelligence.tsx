"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Shield, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LedgerRow {
  id: string;
  deal_id: string;
  event: string;
  actor_type: string;
  actor_id: string | null;
  location: string | null;
  status: string | null;
  notes: string | null;
  hash: string;
  created_at: string;
}

interface CustodyData {
  ledger: LedgerRow[];
  verdict: boolean;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.58;

type IconType = "check" | "lock" | "shield" | "package";

const EVENT_DEFS: Record<string, { label: string; icon: IconType }> = {
  DOC_CREATED: { label: "Document Created", icon: "check" },
  DOC_RECEIVED: { label: "Document Received", icon: "check" },
  DOC_IN_POSSESSION: { label: "In Secure Possession", icon: "lock" },
  DOC_NOTARIZED: { label: "Notarization Complete", icon: "check" },
  DOC_APOSTILLE_SUBMITTED: { label: "Apostille Submitted", icon: "shield" },
  DOC_APOSTILLE_RECEIVED: { label: "Apostille Received", icon: "shield" },
  DOC_LABEL_CREATED: { label: "Courier Label Created", icon: "package" },
  DOC_SHIPPED: { label: "Shipped to Destination", icon: "package" },
  DOC_IN_TRANSIT: { label: "In Transit", icon: "package" },
  DOC_OUT_FOR_DELIVERY: { label: "Out for Delivery", icon: "package" },
  DOC_DELIVERED: { label: "Delivered", icon: "check" },
  DOC_SIGNED: { label: "Signed", icon: "check" },
  DOC_RELEASE_CONFIRMED: { label: "Release Confirmed", icon: "check" },
  DOC_HANDOFF: { label: "Document Handoff", icon: "lock" },
};

function EventIcon({ type, color }: { type: IconType; color: string }) {
  const cls = "w-3 h-3 flex-shrink-0";
  const style = { color };
  if (type === "check") return <CheckCircle2 className={cls} style={style} />;
  if (type === "lock") return <Lock className={cls} style={style} />;
  if (type === "shield") return <Shield className={cls} style={style} />;
  return <Package className={cls} style={style} />;
}

function EmptyState() {
  return (
    <div
      className="rounded-sm"
      style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
          Chain of Custody Intelligence
        </div>
        <div className="text-[8px] uppercase tracking-[0.14em] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
          Custody Confidence · Release Authorization · Vault Status
        </div>
      </div>

      <div className="px-5 py-5">
        <p className="text-[10px] leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
          Open a matter from the Execution Queue to view its full chain-of-custody
          timeline, vault access records, and release authorization status.
        </p>
        <Link href="/dashboard/deals">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-mono uppercase tracking-[0.14em] transition-opacity hover:opacity-70"
            style={{
              background: "rgba(212,175,55,0.05)",
              border: "1px solid rgba(212,175,55,0.18)",
              color: "rgba(212,175,55,0.7)",
            }}
          >
            <Package className="w-3 h-3" />
            Open Execution Queue
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Custody event type matrix */}
        <div className="mt-4 grid grid-cols-2 gap-1.5">
          {Object.entries(EVENT_DEFS).slice(0, 8).map(([, def]) => (
            <div
              key={def.label}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm"
              style={{
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <EventIcon type={def.icon} color="rgba(212,175,55,0.4)" />
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {def.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChainOfCustodyIntelligence({ dealId }: { dealId?: string }) {
  const [data, setData] = useState<CustodyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!dealId) return;
    setIsLoading(true);
    fetch(`/api/deals/${dealId}/custody`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [dealId]);

  if (!dealId) return <EmptyState />;

  return (
    <div
      className="rounded-sm"
      style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div>
          <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
            Chain of Custody Intelligence
          </div>
          <div className="text-[8px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
            {dealId.slice(0, 12).toUpperCase()}
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-1.5">
            {data.verdict ? (
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
            ) : (
              <Shield className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
            )}
            <span
              className="text-[8px] font-mono uppercase tracking-[0.14em]"
              style={{ color: data.verdict ? "#34d399" : "#f59e0b" }}
            >
              {data.verdict ? "Chain Valid" : "Review Required"}
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="overflow-y-auto" style={{ maxHeight: 320, scrollbarWidth: "none" }}>
        {isLoading ? (
          <div className="px-5 py-6 space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-8 rounded-sm animate-pulse"
                style={{ background: "rgba(255,255,255,0.03)" }}
              />
            ))}
          </div>
        ) : !data || data.ledger.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.18)" }}>
              No custody events recorded.
            </div>
          </div>
        ) : (
          <div className="px-5 py-2">
            {[...data.ledger].reverse().map((row, idx) => {
              const def = EVENT_DEFS[row.event];
              const isTerminal = row.event === "DOC_RELEASE_CONFIRMED" || row.event === "DOC_DELIVERED";
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ease: EASE, duration: DURATION, delay: Math.min(idx * 0.04, 0.4) }}
                  className="flex items-start gap-3 py-2.5 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <EventIcon
                      type={def?.icon ?? "check"}
                      color={isTerminal ? "#34d399" : "rgba(212,175,55,0.6)"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[10px] font-medium"
                      style={{ color: isTerminal ? "#34d399" : "rgba(255,255,255,0.6)" }}
                    >
                      {def?.label ?? row.event.replace(/_/g, " ")}
                    </div>
                    {row.notes && (
                      <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {row.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 mt-0.5">
                      <span className="text-[8px] font-mono capitalize" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {row.actor_type}
                      </span>
                      <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
                        {new Date(row.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
