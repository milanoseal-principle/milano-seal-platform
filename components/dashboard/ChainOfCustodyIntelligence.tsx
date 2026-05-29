"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Shield, ShieldCheck, Package, ArrowRight, User } from "lucide-react";
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

const CUSTODY_STAGES = [
  "Received",
  "Notarized",
  "Apostille",
  "Courier Prepared",
  "Shipped",
  "In Transit",
  "Delivered",
] as const;

// Map ledger events to custody stage index
function getStageIndex(ledger: LedgerRow[]): number {
  const events = new Set(ledger.map((r) => r.event));
  if (events.has("DOC_DELIVERED") || events.has("DOC_RELEASE_CONFIRMED")) return 6;
  if (events.has("DOC_IN_TRANSIT") || events.has("DOC_OUT_FOR_DELIVERY")) return 5;
  if (events.has("DOC_SHIPPED") || events.has("DOC_LABEL_CREATED")) return 4;
  if (events.has("DOC_APOSTILLE_RECEIVED")) return 3;
  if (events.has("DOC_APOSTILLE_SUBMITTED") || events.has("DOC_NOTARIZED")) return 2;
  if (events.has("DOC_NOTARIZED")) return 1;
  if (events.has("DOC_RECEIVED") || events.has("DOC_IN_POSSESSION") || events.has("DOC_CREATED")) return 0;
  return -1;
}

function ActorIcon({ actorType }: { actorType: string }) {
  const cls = "w-3.5 h-3.5 flex-shrink-0";
  const color = "rgba(212,175,55,0.65)";
  if (actorType === "system") return <Shield className={cls} style={{ color }} />;
  if (actorType === "operator") return <ShieldCheck className={cls} style={{ color }} />;
  if (actorType === "client") return <User className={cls} style={{ color }} />;
  if (actorType === "courier") return <Package className={cls} style={{ color }} />;
  return <Shield className={cls} style={{ color }} />;
}

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
      style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.12)" }}
    >
      <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="text-[8.5px] font-mono uppercase tracking-[0.32em]" style={{ color: "rgba(212,175,55,0.45)" }}>
          / Chain of Custody
        </div>
        <div className="text-sm font-serif text-white mt-1">Chain of Custody Intelligence</div>
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

  const stageIndex = data ? getStageIndex(data.ledger) : -1;
  const stagePct = stageIndex >= 0 ? Math.round(((stageIndex + 1) / CUSTODY_STAGES.length) * 100) : 0;

  const lastTwo = data ? [...data.ledger].slice(-2).reverse() : [];

  const isDelivered = data
    ? data.ledger.some((r) => r.event === "DOC_DELIVERED" || r.event === "DOC_RELEASE_CONFIRMED")
    : false;

  return (
    <div
      className="rounded-sm"
      style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.12)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "rgba(212,175,55,0.08)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[8.5px] font-mono uppercase tracking-[0.32em]" style={{ color: "rgba(212,175,55,0.45)" }}>
              / Chain of Custody
            </div>
            <div className="text-sm font-serif text-white mt-0.5">Chain of Custody Intelligence</div>
            {dealId && (
              <div className="text-[8px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                {dealId.slice(0, 12).toUpperCase()}
              </div>
            )}
          </div>
          {data && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm flex-shrink-0"
              style={{
                background: data.verdict ? "rgba(52,211,153,0.07)" : "rgba(245,158,11,0.07)",
                border: `1px solid ${data.verdict ? "rgba(52,211,153,0.2)" : "rgba(245,158,11,0.2)"}`,
              }}
            >
              {data.verdict ? (
                <CheckCircle2 className="w-3 h-3" style={{ color: "#34d399" }} />
              ) : (
                <Shield className="w-3 h-3" style={{ color: "#f59e0b" }} />
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
      </div>

      {/* Custody progress bar */}
      {data && data.ledger.length > 0 && (
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.22em]" style={{ color: "rgba(212,175,55,0.4)" }}>
              Custody Progress
            </span>
            <span className="font-mono text-[9px]" style={{ color: "#D4AF37" }}>{stagePct}%</span>
          </div>
          <div className="relative h-1 rounded-full overflow-hidden" style={{ background: "rgba(212,175,55,0.08)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stagePct}%` }}
              transition={{ duration: 0.9, ease: EASE }}
              className="h-full rounded-full"
              style={{ background: stagePct === 100 ? "#34d399" : "linear-gradient(90deg, #8B6914, #D4AF37)" }}
            />
          </div>
          {/* Stage labels */}
          <div className="flex justify-between mt-2">
            {CUSTODY_STAGES.map((stage, i) => (
              <span
                key={stage}
                className="font-mono text-[6.5px] uppercase tracking-[0.1em]"
                style={{
                  color: i <= stageIndex ? "rgba(212,175,55,0.65)" : "rgba(255,255,255,0.12)",
                  fontWeight: i === stageIndex ? 700 : 400,
                }}
              >
                {stage}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hash chain section */}
      {lastTwo.length > 0 && (
        <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.25)" }}>
              Hash Chain
            </span>
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm"
              style={{
                background: data?.verdict ? "rgba(52,211,153,0.06)" : "rgba(245,158,11,0.06)",
                border: `1px solid ${data?.verdict ? "rgba(52,211,153,0.15)" : "rgba(245,158,11,0.15)"}`,
              }}
            >
              <span
                className="font-mono text-[7px] uppercase tracking-[0.14em]"
                style={{ color: data?.verdict ? "#34d399" : "#f59e0b" }}
              >
                {data?.verdict ? "CHAIN INTACT" : "REVIEW"}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            {lastTwo.map((row) => (
              <div key={row.id} className="flex items-center gap-2">
                <span className="font-mono text-[8px]" style={{ color: "rgba(212,175,55,0.35)" }}>
                  #{row.hash.slice(0, 8).toUpperCase()}...
                </span>
                <span className="font-mono text-[8px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                  {EVENT_DEFS[row.event]?.label ?? row.event.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="overflow-y-auto" style={{ maxHeight: 300, scrollbarWidth: "none" }}>
        {isLoading ? (
          <div className="px-5 py-6 space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 rounded-sm animate-pulse"
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
              const isFirst = idx === 0;
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ease: EASE, duration: DURATION, delay: Math.min(idx * 0.04, 0.4) }}
                  className="flex items-start gap-3 py-2.5 border-b"
                  style={{
                    borderColor: isFirst ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.04)",
                    background: isTerminal ? "rgba(52,211,153,0.03)" : "transparent",
                  }}
                >
                  {/* Actor icon */}
                  <div
                    className="flex-shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-sm"
                    style={{
                      background: isTerminal ? "rgba(52,211,153,0.1)" : "rgba(212,175,55,0.06)",
                      border: `1px solid ${isTerminal ? "rgba(52,211,153,0.2)" : "rgba(212,175,55,0.12)"}`,
                    }}
                  >
                    <ActorIcon actorType={row.actor_type} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div
                        className="text-[10px] font-medium"
                        style={{ color: isTerminal ? "#34d399" : "rgba(255,255,255,0.7)" }}
                      >
                        {def?.label ?? row.event.replace(/_/g, " ")}
                      </div>
                      {isTerminal && (
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#34d399" }} />
                      )}
                    </div>
                    {row.notes && (
                      <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                        {row.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                      <span className="font-mono text-[8px] capitalize" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {row.actor_type}
                      </span>
                      <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
                      <span className="font-mono text-[8px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                        {new Date(row.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {row.location && (
                        <span
                          className="font-mono text-[7.5px] px-1.5 py-0.5 rounded-sm"
                          style={{
                            background: "rgba(212,175,55,0.05)",
                            border: "1px solid rgba(212,175,55,0.1)",
                            color: "rgba(212,175,55,0.5)",
                          }}
                        >
                          {row.location}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer bar */}
      {data && (
        <div
          className="px-5 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-[8px] uppercase tracking-[0.2em]"
              style={{ color: data.verdict ? "#34d399" : "#f59e0b" }}
            >
              {data.verdict
                ? "CHAIN VERIFIED — TAMPER-EVIDENT RECORD"
                : "REVIEW REQUIRED"}
            </span>
            {/* Export button — shown only if delivered */}
            {isDelivered && dealId && (
              <a
                href={`/api/evidence/${dealId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[8px] uppercase tracking-[0.14em] flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: "rgba(212,175,55,0.7)" }}
              >
                GENERATE EVIDENCE PACKET
                <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
