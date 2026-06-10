"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, AlertTriangle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

type ReconciliationStatus =
  | "matched"
  | "paid_not_scheduled"
  | "scheduled_not_paid"
  | "apostille_complete_not_shipped"
  | "shipped_not_delivered"
  | "delivered_not_released";

interface ReconciliationRecord {
  matter_id: string;
  client_name: string;
  document_type: string;
  wise_amount: string | null;
  wise_confirmed: boolean;
  invoice_ref: string | null;
  shippo_label: boolean;
  carrier: string | null;
  tracking: string | null;
  delivery_confirmed: boolean;
  release_confirmed: boolean;
  apostille_complete: boolean;
  status: ReconciliationStatus;
}

// ── Demo data ──────────────────────────────────────────────────────────────────

const RECORDS: ReconciliationRecord[] = [
  {
    matter_id: "MS-2024-0041",
    client_name: "A. Carvalho",
    document_type: "Birth Certificate",
    wise_amount: "$320.00",
    wise_confirmed: true,
    invoice_ref: "INV-0041",
    shippo_label: false,
    carrier: null,
    tracking: null,
    delivery_confirmed: false,
    release_confirmed: false,
    apostille_complete: false,
    status: "apostille_complete_not_shipped",
  },
  {
    matter_id: "MS-2024-0039",
    client_name: "R. Okonkwo",
    document_type: "Power of Attorney",
    wise_amount: "$275.00",
    wise_confirmed: true,
    invoice_ref: "INV-0039",
    shippo_label: true,
    carrier: "DHL",
    tracking: "DHL-9831220044",
    delivery_confirmed: false,
    release_confirmed: false,
    apostille_complete: false,
    status: "shipped_not_delivered",
  },
  {
    matter_id: "MS-2024-0038",
    client_name: "L. Ferreira",
    document_type: "Marriage Certificate",
    wise_amount: null,
    wise_confirmed: false,
    invoice_ref: "INV-0038",
    shippo_label: false,
    carrier: null,
    tracking: null,
    delivery_confirmed: false,
    release_confirmed: false,
    apostille_complete: false,
    status: "scheduled_not_paid",
  },
  {
    matter_id: "MS-2024-0035",
    client_name: "T. Nakamura",
    document_type: "Academic Transcript",
    wise_amount: "$450.00",
    wise_confirmed: true,
    invoice_ref: "INV-0035",
    shippo_label: true,
    carrier: "FedEx",
    tracking: "FX-7741003882",
    delivery_confirmed: true,
    release_confirmed: true,
    apostille_complete: true,
    status: "matched",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<ReconciliationStatus, { label: string; color: string; bg: string; border: string; icon: "ok" | "warn" | "err" | "clock" }> = {
  matched:                         { label: "Fully Reconciled",              color: "rgba(34,197,94,0.8)",    bg: "rgba(34,197,94,0.05)",    border: "rgba(34,197,94,0.15)",    icon: "ok" },
  paid_not_scheduled:              { label: "Paid — Not Scheduled",           color: "rgba(245,158,11,0.8)",   bg: "rgba(245,158,11,0.05)",   border: "rgba(245,158,11,0.18)",   icon: "warn" },
  scheduled_not_paid:              { label: "Scheduled — Not Paid",           color: "rgba(239,68,68,0.75)",   bg: "rgba(239,68,68,0.05)",    border: "rgba(239,68,68,0.18)",    icon: "err" },
  apostille_complete_not_shipped:  { label: "Apostille Done — Not Shipped",   color: "rgba(99,102,241,0.75)",  bg: "rgba(99,102,241,0.05)",   border: "rgba(99,102,241,0.18)",   icon: "warn" },
  shipped_not_delivered:           { label: "Shipped — Awaiting Delivery",    color: "rgba(59,130,246,0.75)",  bg: "rgba(59,130,246,0.05)",   border: "rgba(59,130,246,0.18)",   icon: "clock" },
  delivered_not_released:          { label: "Delivered — Not Released",       color: "rgba(212,175,55,0.8)",   bg: "rgba(212,175,55,0.05)",   border: "rgba(212,175,55,0.18)",   icon: "warn" },
};

function StatusIcon({ kind }: { kind: "ok" | "warn" | "err" | "clock" }) {
  if (kind === "ok") return <CheckCircle2 size={13} style={{ color: "rgba(34,197,94,0.8)" }} />;
  if (kind === "err") return <XCircle size={13} style={{ color: "rgba(239,68,68,0.75)" }} />;
  if (kind === "clock") return <Clock size={13} style={{ color: "rgba(59,130,246,0.7)" }} />;
  return <AlertTriangle size={13} style={{ color: "rgba(245,158,11,0.75)" }} />;
}

const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

// ── Stage row ──────────────────────────────────────────────────────────────────

function Stage({ label, done, value }: { label: string; done: boolean; value?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      {done
        ? <CheckCircle2 size={11} style={{ color: "rgba(34,197,94,0.7)", flexShrink: 0 }} />
        : <div className="w-2.5 h-2.5 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.15)", flexShrink: 0 }} />}
      <span style={{ fontSize: 9, color: done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)" }}>{label}</span>
      {value && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginLeft: 2 }}>{value}</span>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReconciliationPage() {
  const [filter, setFilter] = useState<ReconciliationStatus | "all">("all");

  const filtered = RECORDS.filter((r) => filter === "all" || r.status === filter);
  const unmatched = RECORDS.filter((r) => r.status !== "matched").length;

  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      <Link href="/dashboard/matter-intelligence"
        className="inline-flex items-center gap-1.5 mb-5 text-[10px] hover:opacity-80 transition-opacity"
        style={{ color: GOLD_DIM, letterSpacing: "0.15em" }}>
        <ArrowLeft size={11} /> MATTER INTELLIGENCE
      </Link>

      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>RECONCILIATION ENGINE</p>
        <h1 style={{ fontSize: "clamp(1rem,2.5vw,1.35rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8", marginBottom: 4 }}>
          Payment / Courier Reconciliation
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Reconcile Wise payment · invoice · Shippo label · carrier tracking · delivery · release confirmation.
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(Object.keys(STATUS_META) as ReconciliationStatus[]).map((s) => {
          const count = RECORDS.filter((r) => r.status === s).length;
          if (count === 0) return null;
          const meta = STATUS_META[s];
          return (
            <button key={s} onClick={() => setFilter(filter === s ? "all" : s)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[9px] tracking-widest transition-colors"
              style={{
                border: `1px solid ${filter === s ? meta.color : meta.border}`,
                background: filter === s ? meta.bg : "transparent",
                color: meta.color,
              }}>
              <StatusIcon kind={meta.icon} />
              {count} {meta.label.toUpperCase()}
            </button>
          );
        })}
        {filter !== "all" && (
          <button onClick={() => setFilter("all")}
            className="px-2.5 py-1 rounded-sm text-[9px] hover:bg-white/5 transition-colors"
            style={{ border: `1px solid ${BORDER}`, color: GOLD_DIM }}>
            SHOW ALL
          </button>
        )}
      </div>

      {unmatched > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-sm px-4 py-2.5"
          style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <AlertTriangle size={12} style={{ color: "rgba(239,68,68,0.7)" }} />
          <span style={{ fontSize: 10, color: "rgba(239,68,68,0.65)", letterSpacing: "0.08em" }}>
            {unmatched} matter{unmatched > 1 ? "s" : ""} have reconciliation gaps. Review and resolve before release.
          </span>
        </div>
      )}

      {/* Records */}
      <div className="space-y-3">
        {filtered.map((r) => {
          const meta = STATUS_META[r.status];
          return (
            <div key={r.matter_id} className="rounded-sm p-4"
              style={{ border: `1px solid ${meta.border}`, background: meta.bg }}>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div style={{ fontSize: 11, color: "rgba(212,175,55,0.9)", letterSpacing: "0.05em" }}>{r.matter_id}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{r.client_name} · {r.document_type}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <StatusIcon kind={meta.icon} />
                  <span style={{ fontSize: 9, color: meta.color, letterSpacing: "0.1em" }}>{meta.label.toUpperCase()}</span>
                </div>
              </div>

              {/* Stage pipeline */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
                <Stage label="Wise payment received" done={r.wise_confirmed} value={r.wise_amount} />
                <Stage label="Invoice matched" done={!!r.invoice_ref} value={r.invoice_ref} />
                <Stage label="Apostille complete" done={r.apostille_complete} />
                <Stage label="Shippo label created" done={r.shippo_label} />
                <Stage label="Carrier tracking active" done={!!r.tracking} value={r.tracking} />
                <Stage label="Delivery confirmed" done={r.delivery_confirmed} />
                <Stage label="Release confirmed" done={r.release_confirmed} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4" style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
        {filtered.length} OF {RECORDS.length} RECORDS · FINANCIAL SCOPE: MATTER ENFORCED
      </div>
    </div>
  );
}
