"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";

interface Matter {
  id: string;
  deal_status: string;
  payment_status: string | null;
  destination_country: string | null;
  document_type: string | null;
  updated_at: string;
}

interface CustodyEvent {
  id: string;
  event: string;
  actor_type: string | null;
  created_at: string;
  status: string | null;
}

interface ApiResponse {
  matter: Matter | null;
  events: CustodyEvent[];
}

// Status ordering for comparison
const STATUS_ORDER = [
  "under_review",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "courier_ready",
  "shipped",
  "delivered",
  "completed",
];

function statusGte(status: string, target: string): boolean {
  return STATUS_ORDER.indexOf(status) >= STATUS_ORDER.indexOf(target);
}

function hasEvent(events: CustodyEvent[], ...eventNames: string[]): CustodyEvent | undefined {
  return events.find((e) => eventNames.includes(e.event));
}

type StepStatus = "done" | "active" | "pending";

interface Step {
  label: string;
  status: StepStatus;
  timestamp?: string;
}

function deriveSteps(matter: Matter, events: CustodyEvent[]): Step[] {
  const s = matter.deal_status;

  // Step 1: Intake Received — always done if matter exists
  const step1: Step = { label: "Intake Received", status: "done", timestamp: matter.updated_at };

  // Step 2: Compliance Verified — done if status past under_review
  const compDone = statusGte(s, "scheduled");
  const compActive = s === "under_review";
  const step2: Step = {
    label: "Compliance Verified",
    status: compDone ? "done" : compActive ? "active" : "pending",
  };

  // Step 3: Payment Cleared
  const payEvent = hasEvent(events, "PAYMENT_CONFIRMED");
  const payDone =
    !!payEvent ||
    matter.payment_status === "paid" ||
    matter.payment_status === "payment_confirmed";
  const payActive = !payDone && statusGte(s, "scheduled");
  const step3: Step = {
    label: "Payment Cleared",
    status: payDone ? "done" : payActive ? "active" : "pending",
    timestamp: payEvent?.created_at,
  };

  // Step 4: Execution Completed
  const execEvent = hasEvent(events, "DOC_SIGNED", "DOC_NOTARIZED");
  const execDone = !!execEvent || statusGte(s, "apostille_processing");
  const execActive = !execDone && s === "in_execution";
  const step4: Step = {
    label: "Execution Completed",
    status: execDone ? "done" : execActive ? "active" : "pending",
    timestamp: execEvent?.created_at,
  };

  // Step 5: Apostille Submitted
  const apostilleEvent = hasEvent(events, "DOC_APOSTILLE_SUBMITTED");
  const apostilleDone =
    !!apostilleEvent ||
    statusGte(s, "courier_ready");
  const apostilleActive = !apostilleDone && s === "apostille_processing";
  const step5: Step = {
    label: "Apostille Submitted",
    status: apostilleDone ? "done" : apostilleActive ? "active" : "pending",
    timestamp: apostilleEvent?.created_at,
  };

  // Step 6: Courier Released
  const courierEvent = hasEvent(events, "DOC_SHIPPED", "DOC_LABEL_CREATED");
  const courierDone =
    !!courierEvent ||
    statusGte(s, "shipped");
  const courierActive = !courierDone && s === "courier_ready";
  const step6: Step = {
    label: "Courier Released",
    status: courierDone ? "done" : courierActive ? "active" : "pending",
    timestamp: courierEvent?.created_at,
  };

  // Step 7: Delivered
  const deliveredEvent = hasEvent(events, "DOC_DELIVERED");
  const deliveredDone =
    !!deliveredEvent ||
    s === "delivered" ||
    s === "completed";
  const deliveredActive = !deliveredDone && s === "shipped";
  const step7: Step = {
    label: "Delivered",
    status: deliveredDone ? "done" : deliveredActive ? "active" : "pending",
    timestamp: deliveredEvent?.created_at,
  };

  return [step1, step2, step3, step4, step5, step6, step7];
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActiveExecutionTimeline() {
  const { data, isLoading } = useApi<ApiResponse>("/api/dashboard/active-timeline");

  const containerStyle: React.CSSProperties = {
    background: "rgba(8,5,1,0.97)",
    border: "1px solid rgba(212,175,55,0.08)",
    padding: "1.5rem",
  };

  const gold = "rgba(198,165,90,1)";
  const goldMuted = "rgba(198,165,90,0.5)";
  const goldDim = "rgba(198,165,90,0.15)";
  const textMuted = "rgba(255,255,255,0.28)";

  if (isLoading) {
    return (
      <div style={containerStyle}>
        <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase" }}>
          Active Execution Timeline
        </p>
        <div style={{ marginTop: "1rem", color: textMuted, fontSize: 12 }}>Loading…</div>
      </div>
    );
  }

  if (!data?.matter) {
    return (
      <div style={containerStyle}>
        <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase" }}>
          Active Execution Timeline
        </p>
        <div style={{ marginTop: "1.5rem", textAlign: "center", color: textMuted, fontSize: 13 }}>
          No active matters in execution pipeline.
        </div>
      </div>
    );
  }

  const steps = deriveSteps(data.matter, data.events);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", margin: 0 }}>
          Active Execution Timeline
        </p>
        <span style={{ color: textMuted, fontSize: 10, fontFamily: "monospace" }}>
          Last updated: {formatDate(data.matter.updated_at)}
        </span>
      </div>

      {/* Matter identity */}
      <div style={{ marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "baseline" }}>
        <span style={{ color: gold, fontFamily: "monospace", fontSize: 11, letterSpacing: "0.12em" }}>
          {data.matter.id.slice(0, 8).toUpperCase()}
        </span>
        {data.matter.destination_country && (
          <span style={{ color: textMuted, fontSize: 11 }}>
            → {data.matter.destination_country}
          </span>
        )}
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, idx) => {
          const isDone = step.status === "done";
          const isActive = step.status === "active";
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.label} style={{ display: "flex", gap: "0.875rem" }}>
              {/* Dot + connector */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16 }}>
                {isActive ? (
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: gold,
                      boxShadow: `0 0 6px ${gold}`,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: isDone ? gold : "transparent",
                      border: isDone ? "none" : `1px solid ${goldDim}`,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
                {!isLast && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 20,
                      background: isDone ? `rgba(198,165,90,0.3)` : goldDim,
                      marginTop: 2,
                      marginBottom: 2,
                    }}
                  />
                )}
              </div>

              {/* Label + timestamp */}
              <div style={{ paddingBottom: isLast ? 0 : "0.625rem", paddingTop: 2, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: isDone ? "rgba(255,255,255,0.85)" : isActive ? gold : textMuted,
                      fontFamily: isActive ? "monospace" : "inherit",
                    }}
                  >
                    {step.label}
                  </span>
                  {step.timestamp && (
                    <span style={{ color: textMuted, fontSize: 10, fontFamily: "monospace" }}>
                      {formatTime(step.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
