"use client";

import { CheckCircle2, XCircle, AlertTriangle, Package, Truck } from "lucide-react";
import type { ContextItem, MatterState } from "@/components/va/ContextStream";

const STATE_LABEL: Record<MatterState, string> = {
  intake_received: "Intake Received",
  under_review: "Under Review",
  awaiting_payment: "Awaiting Payment",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille Processing",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
};

const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";

interface VAMatterCardProps {
  item: ContextItem;
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.15em", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 10, color: valueColor ?? "rgba(255,255,255,0.65)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

export function VAMatterCard({ item }: VAMatterCardProps) {
  return (
    <div className="rounded-sm p-4" style={{ border: `1px solid ${BORDER}`, background: "rgba(255,255,255,0.025)", fontFamily: "monospace" }}>
      <div style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 8 }}>MATTER SUMMARY</div>

      <Row label="MATTER ID" value={item.matter_id} valueColor={GOLD} />
      <Row label="CLIENT" value={item.client_name} />
      <Row label="DOCUMENT" value={item.document_type} />
      <Row label="DESTINATION" value={item.destination_country} />
      <Row label="STATE" value={STATE_LABEL[item.current_state]} />
      <Row label="OPERATOR" value={item.assigned_operator} />

      {/* Payment gate */}
      <div className="flex items-center gap-2 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.15em" }}>PAYMENT GATE</span>
        <div className="ml-auto flex items-center gap-1.5">
          {item.payment_confirmed
            ? <>
                <CheckCircle2 size={11} style={{ color: "rgba(34,197,94,0.7)" }} />
                <span style={{ fontSize: 9, color: "rgba(34,197,94,0.7)" }}>CONFIRMED</span>
              </>
            : <>
                <XCircle size={11} style={{ color: "rgba(239,68,68,0.7)" }} />
                <span style={{ fontSize: 9, color: "rgba(239,68,68,0.7)" }}>PENDING</span>
              </>}
        </div>
      </div>

      {/* Packet status */}
      <div className="flex items-center gap-2 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.15em" }}>PACKET</span>
        <div className="ml-auto flex items-center gap-1.5">
          {item.packet_flags.length === 0
            ? <>
                <CheckCircle2 size={11} style={{ color: "rgba(34,197,94,0.55)" }} />
                <span style={{ fontSize: 9, color: "rgba(34,197,94,0.55)" }}>CLEAR</span>
              </>
            : <>
                <Package size={11} style={{ color: "rgba(245,158,11,0.7)" }} />
                <span style={{ fontSize: 9, color: "rgba(245,158,11,0.7)" }}>{item.packet_flags.length} FLAG{item.packet_flags.length > 1 ? "S" : ""}</span>
              </>}
        </div>
      </div>

      {/* Courier */}
      <div className="flex items-center gap-2 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.15em" }}>COURIER</span>
        <div className="ml-auto flex items-center gap-1.5">
          {item.courier_status === "in_transit"
            ? <><Truck size={11} style={{ color: "rgba(59,130,246,0.7)" }} /><span style={{ fontSize: 9, color: "rgba(59,130,246,0.7)" }}>IN TRANSIT</span></>
            : item.courier_status === "delivered"
            ? <><CheckCircle2 size={11} style={{ color: "rgba(34,197,94,0.7)" }} /><span style={{ fontSize: 9, color: "rgba(34,197,94,0.7)" }}>DELIVERED</span></>
            : item.courier_status === "n_a"
            ? <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>N/A</span>
            : <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>NOT SHIPPED</span>}
        </div>
      </div>

      {/* Next safe action */}
      <div className="mt-3 rounded-sm px-3 py-2" style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)" }}>
        <div style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.15em", marginBottom: 3 }}>NEXT SAFE ACTION</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{item.next_safe_action}</div>
      </div>

      {/* Payment warning */}
      {!item.payment_confirmed && (
        <div className="mt-2 flex items-center gap-2 rounded-sm px-3 py-2"
          style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
          <AlertTriangle size={11} style={{ color: "rgba(239,68,68,0.6)" }} />
          <span style={{ fontSize: 9, color: "rgba(239,68,68,0.55)", letterSpacing: "0.08em" }}>
            PAYMENT REQUIRED — VA ACTION LIMITED
          </span>
        </div>
      )}
    </div>
  );
}
