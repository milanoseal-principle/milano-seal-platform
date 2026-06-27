/* ms-allow-critical-overflow-hidden: overflow-hidden here is decorative (rounded corners + top accent line); the card self-sizes and never clips its own content. */
"use client";

import { useApi } from "@/hooks/useApi";
import { timeAgo } from "@/lib/format";
import type { MilanoActivity } from "@/lib/milanoSerialize";

// Canonical event vocabulary — only real pipeline events shown
const ALLOWED_ACTIONS = new Set([
  "intake_created",
  "compliance_verified",
  "invoice_sent",
  "payment_received",
  "execution_scheduled",
  "ron_completed",
  "apostille_submitted",
  "apostille_completed",
  "delivered",
  // also handle uppercase variants
  "INTAKE_CREATED",
  "COMPLIANCE_VERIFIED",
  "INVOICE_SENT",
  "PAYMENT_RECEIVED",
  "EXECUTION_SCHEDULED",
  "RON_COMPLETED",
  "APOSTILLE_SUBMITTED",
  "APOSTILLE_COMPLETED",
  "DELIVERED",
]);

const ACTION_LABEL: Record<string, string> = {
  intake_created:       "Intake Created",
  compliance_verified:  "Compliance Verified",
  invoice_sent:         "Invoice Sent",
  payment_received:     "Payment Received",
  execution_scheduled:  "Execution Scheduled",
  ron_completed:        "RON Completed",
  apostille_submitted:  "Apostille Submitted",
  apostille_completed:  "Apostille Completed",
  delivered:            "Delivered",
};

const ACTION_COLOR: Record<string, string> = {
  intake_created:      "#6B7280",
  compliance_verified: "#C6A55A",
  invoice_sent:        "#8B5CF6",
  payment_received:    "#10B981",
  execution_scheduled: "#C6A55A",
  ron_completed:       "#C6A55A",
  apostille_submitted: "#F59E0B",
  apostille_completed: "#10B981",
  delivered:           "#10B981",
};

function normalize(action: string): string {
  return action.toLowerCase();
}

function EventDot({ action }: { action: string }) {
  const color = ACTION_COLOR[normalize(action)] ?? "#333";
  return (
    <div className="relative flex-shrink-0 mt-0.5">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <div className="absolute inset-0 rounded-full" style={{ background: color, opacity: 0.25, transform: "scale(2.5)" }} />
    </div>
  );
}

export function OperatorEventTimeline() {
  const { data, isLoading, isError } = useApi<MilanoActivity[]>("/api/admin/activity");

  const events = (data ?? [])
    .filter((e) => ALLOWED_ACTIONS.has(e.action))
    .slice(0, 24);

  return (
    <div data-critical-card="" className="rounded-xl border border-white/[0.05] bg-[#050507] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C6A55A]/60" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555]">
            Operator Event Timeline
          </span>
        </div>
        <span className="font-mono text-[8px] text-[#2A2A2A]">REAL EVENTS ONLY</span>
      </div>

      <div className="px-5 py-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] flex-shrink-0 mt-1.5 animate-pulse" />
                <div className="flex-1 h-3 bg-[#0F0F0F] rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <p className="font-mono text-[9px] text-[#333] tracking-widest uppercase text-center py-4">
            Event feed unavailable
          </p>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <p className="font-mono text-[9px] text-[#2A2A2A] tracking-widest uppercase text-center py-6">
            No pipeline events recorded yet
          </p>
        )}

        {events.length > 0 && (
          <div className="relative">
            {/* Vertical spine */}
            <div className="absolute left-[2.5px] top-2 bottom-2 w-px bg-white/[0.04]" />

            <div className="space-y-3 pl-5">
              {events.map((e) => {
                const norm = normalize(e.action);
                const label = ACTION_LABEL[norm] ?? e.action;

                return (
                  <div key={e.id} className="relative flex items-start gap-3">
                    <div className="absolute -left-5 mt-1.5">
                      <EventDot action={e.action} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] tracking-[0.12em] uppercase"
                          style={{ color: ACTION_COLOR[norm] ?? "#555" }}>
                          {label}
                        </span>
                        <span className="font-mono text-[8px] text-[#333] flex-shrink-0">
                          {timeAgo(e.created_at)}
                        </span>
                      </div>
                      {e.detail && (
                        <p className="font-mono text-[8px] text-[#444] mt-0.5 truncate">
                          {e.detail}
                        </p>
                      )}
                      {e.deal_id && (
                        <p className="font-mono text-[7px] text-[#2E2E2E] mt-0.5">
                          {e.deal_id}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
