"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Upload,
  GitMerge,
  Map,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type MatterStatus =
  | "intake_received"
  | "under_review"
  | "awaiting_payment"
  | "scheduled"
  | "in_execution"
  | "apostille_processing"
  | "in_transit"
  | "delivered"
  | "completed";

interface MatterRecord {
  matter_id: string;
  client_name: string;
  client_email: string;
  document_type: string;
  origin_jurisdiction: string;
  signer_location: string;
  destination_country: string;
  apostille_required: boolean;
  payment_status: "pending" | "confirmed" | "failed";
  execution_status: MatterStatus;
  apostille_status: "not_started" | "in_progress" | "complete" | "n_a";
  courier_status: "not_shipped" | "in_transit" | "delivered" | "n_a";
  tracking_number: string | null;
  release_status: "pending" | "released" | "blocked";
  packet_score: number | null;
  flags: string[];
}

// ── Static demo seed (operator-only, no sensitive fields exposed) ──────────────

const DEMO: MatterRecord[] = [
  {
    matter_id: "MS-2024-0041",
    client_name: "A. Carvalho",
    client_email: "—",
    document_type: "Birth Certificate",
    origin_jurisdiction: "Florida",
    signer_location: "Miami, FL",
    destination_country: "Portugal",
    apostille_required: true,
    payment_status: "confirmed",
    execution_status: "apostille_processing",
    apostille_status: "in_progress",
    courier_status: "not_shipped",
    tracking_number: null,
    release_status: "pending",
    packet_score: 88,
    flags: [],
  },
  {
    matter_id: "MS-2024-0039",
    client_name: "R. Okonkwo",
    client_email: "—",
    document_type: "Power of Attorney",
    origin_jurisdiction: "New York",
    signer_location: "New York, NY",
    destination_country: "Nigeria",
    apostille_required: false,
    payment_status: "confirmed",
    execution_status: "in_transit",
    apostille_status: "n_a",
    courier_status: "in_transit",
    tracking_number: "DHL-9831220044",
    release_status: "released",
    packet_score: 100,
    flags: [],
  },
  {
    matter_id: "MS-2024-0038",
    client_name: "L. Ferreira",
    client_email: "—",
    document_type: "Marriage Certificate",
    origin_jurisdiction: "California",
    signer_location: "Los Angeles, CA",
    destination_country: "Brazil",
    apostille_required: true,
    payment_status: "pending",
    execution_status: "awaiting_payment",
    apostille_status: "not_started",
    courier_status: "not_shipped",
    tracking_number: null,
    release_status: "blocked",
    packet_score: null,
    flags: ["payment_required"],
  },
  {
    matter_id: "MS-2024-0035",
    client_name: "T. Nakamura",
    client_email: "—",
    document_type: "Academic Transcript",
    origin_jurisdiction: "Texas",
    signer_location: "Houston, TX",
    destination_country: "Japan",
    apostille_required: true,
    payment_status: "confirmed",
    execution_status: "completed",
    apostille_status: "complete",
    courier_status: "delivered",
    tracking_number: "FX-7741003882",
    release_status: "released",
    packet_score: 100,
    flags: [],
  },
  {
    matter_id: "MS-2024-0044",
    client_name: "M. Diallo",
    client_email: "—",
    document_type: "Corporate Resolution",
    origin_jurisdiction: "Delaware",
    signer_location: "Wilmington, DE",
    destination_country: "Senegal",
    apostille_required: false,
    payment_status: "confirmed",
    execution_status: "under_review",
    apostille_status: "n_a",
    courier_status: "not_shipped",
    tracking_number: null,
    release_status: "pending",
    packet_score: 62,
    flags: ["missing_notary_block", "missing_signature"],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<MatterStatus, string> = {
  intake_received: "Intake",
  under_review: "Under Review",
  awaiting_payment: "Awaiting Payment",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
};

const STATUS_COLOR: Record<MatterStatus, string> = {
  intake_received: "rgba(212,175,55,0.5)",
  under_review: "rgba(212,175,55,0.7)",
  awaiting_payment: "rgba(239,68,68,0.7)",
  scheduled: "rgba(34,197,94,0.6)",
  in_execution: "rgba(34,197,94,0.8)",
  apostille_processing: "rgba(99,102,241,0.7)",
  in_transit: "rgba(59,130,246,0.7)",
  delivered: "rgba(34,197,94,0.7)",
  completed: "rgba(212,175,55,0.9)",
};

function packetScoreColor(score: number | null): string {
  if (score === null) return "rgba(255,255,255,0.2)";
  if (score >= 90) return "rgba(34,197,94,0.8)";
  if (score >= 70) return "rgba(212,175,55,0.8)";
  return "rgba(239,68,68,0.75)";
}

function exportCSV(records: MatterRecord[]) {
  const headers = [
    "Matter ID", "Client", "Document Type", "Origin", "Destination",
    "Apostille", "Payment", "Status", "Courier", "Tracking", "Packet Score", "Flags",
  ];
  const rows = records.map((r) => [
    r.matter_id, r.client_name, r.document_type, r.origin_jurisdiction,
    r.destination_country, r.apostille_required ? "Yes" : "No",
    r.payment_status, STATUS_LABEL[r.execution_status],
    r.courier_status, r.tracking_number ?? "", r.packet_score ?? "",
    r.flags.join("; "),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `milano-seal-matter-intelligence-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-module cards ───────────────────────────────────────────────────────────

const MODULES = [
  {
    href: "/dashboard/matter-intelligence/packet-review",
    icon: Upload,
    label: "Document Packet Upload",
    desc: "Upload executed packet. Get completeness score, missing flags, apostille readiness.",
  },
  {
    href: "/dashboard/matter-intelligence/reconciliation",
    icon: GitMerge,
    label: "Payment / Courier Reconciliation",
    desc: "Reconcile Wise payment + invoice + Shippo label + carrier tracking + delivery confirmation.",
  },
  {
    href: "/dashboard/matter-intelligence/routing-rules",
    icon: Map,
    label: "Global Registry + Routing Rules",
    desc: "Match destination country, document type, Hague path, RON eligibility, courier requirement.",
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const BG = "rgba(8,5,1,0.99)";
const SURFACE = "rgba(255,255,255,0.03)";

export default function MatterIntelligencePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MatterStatus | "all">("all");
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);

  const filtered = useMemo(() => {
    return DEMO.filter((m) => {
      if (needsReviewOnly && m.flags.length === 0 && (m.packet_score ?? 100) >= 90) return false;
      if (statusFilter !== "all" && m.execution_status !== statusFilter) return false;
      const q = search.toLowerCase();
      if (q && !m.matter_id.toLowerCase().includes(q) && !m.client_name.toLowerCase().includes(q) &&
        !m.document_type.toLowerCase().includes(q) && !m.destination_country.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, statusFilter, needsReviewOnly]);

  const needsReviewCount = DEMO.filter((m) => m.flags.length > 0 || (m.packet_score !== null && m.packet_score < 90)).length;

  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>
          OPERATOR CONTROL LAYER
        </p>
        <h1 style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8", marginBottom: 4 }}>
          Matter Intelligence Workspace
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Search, filter, and QA every matter by status, packet health, payment, and courier state.
        </p>
      </div>

      {/* Sub-module cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {MODULES.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="block rounded-sm p-4 transition-colors hover:bg-white/5"
            style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center"
                style={{ background: "rgba(212,175,55,0.1)" }}>
                <Icon size={14} style={{ color: GOLD }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#f4e5b8", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{desc}</div>
              </div>
              <ChevronRight size={12} style={{ color: GOLD_DIM, marginLeft: "auto", flexShrink: 0 }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Needs Review banner */}
      {needsReviewCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-sm px-4 py-2.5"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <AlertTriangle size={13} style={{ color: "rgba(239,68,68,0.8)" }} />
          <span style={{ fontSize: 10, color: "rgba(239,68,68,0.75)", letterSpacing: "0.1em" }}>
            {needsReviewCount} MATTER{needsReviewCount > 1 ? "S" : ""} NEED REVIEW — missing docs, flags, or incomplete packet
          </span>
          <button onClick={() => setNeedsReviewOnly((v) => !v)}
            className="ml-auto text-[9px] tracking-widest px-2 py-1 rounded-sm transition-colors"
            style={{
              color: needsReviewOnly ? "#050507" : "rgba(239,68,68,0.75)",
              background: needsReviewOnly ? "rgba(239,68,68,0.7)" : "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}>
            {needsReviewOnly ? "SHOWING FLAGGED" : "SHOW FLAGGED ONLY"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={12} style={{ color: GOLD_DIM, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search matter ID, client, document, destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm bg-transparent outline-none text-[12px]"
            style={{
              border: `1px solid ${BORDER}`, color: "#e8e4dc", padding: "6px 10px 6px 28px",
              fontFamily: "monospace", caretColor: GOLD,
            }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter size={10} style={{ color: GOLD_DIM }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MatterStatus | "all")}
            className="bg-transparent rounded-sm outline-none text-[10px] cursor-pointer"
            style={{ border: `1px solid ${BORDER}`, color: "#e8e4dc", padding: "5px 8px", fontFamily: "monospace" }}>
            <option value="all" style={{ background: "#0d0b07" }}>All Statuses</option>
            {(Object.keys(STATUS_LABEL) as MatterStatus[]).map((s) => (
              <option key={s} value={s} style={{ background: "#0d0b07" }}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
        <button onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-colors hover:bg-white/5 text-[10px]"
          style={{ border: `1px solid ${BORDER}`, color: GOLD_DIM, letterSpacing: "0.12em" }}>
          <Download size={11} />
          EXPORT CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
        {/* Table head */}
        <div className="hidden md:grid grid-cols-[140px_1fr_1fr_120px_90px_100px_90px_80px] gap-3 px-4 py-2"
          style={{ background: "rgba(212,175,55,0.04)", borderBottom: `1px solid ${BORDER}` }}>
          {["MATTER", "DOCUMENT", "DESTINATION", "STATUS", "PAYMENT", "COURIER", "PACKET", "FLAGS"].map((h) => (
            <span key={h} style={{ fontSize: 8, letterSpacing: "0.2em", color: GOLD_DIM }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center" style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
            No matters match this filter.
          </div>
        )}

        {filtered.map((m, i) => (
          <div key={m.matter_id}
            className="px-4 py-3 flex flex-col md:grid md:grid-cols-[140px_1fr_1fr_120px_90px_100px_90px_80px] gap-2 md:gap-3 md:items-center transition-colors hover:bg-white/[0.02]"
            style={{ borderTop: i > 0 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>

            {/* Matter ID */}
            <div>
              <div style={{ fontSize: 11, color: GOLD, letterSpacing: "0.05em" }}>{m.matter_id}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{m.client_name}</div>
            </div>

            {/* Document */}
            <div>
              <div style={{ fontSize: 10, color: "#e8e4dc" }}>{m.document_type}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{m.origin_jurisdiction}</div>
            </div>

            {/* Destination */}
            <div>
              <div style={{ fontSize: 10, color: "#e8e4dc" }}>{m.destination_country}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                {m.apostille_required ? "Apostille required" : "No apostille"}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: STATUS_COLOR[m.execution_status] }} />
              <span style={{ fontSize: 9, color: STATUS_COLOR[m.execution_status], letterSpacing: "0.08em" }}>
                {STATUS_LABEL[m.execution_status]}
              </span>
            </div>

            {/* Payment */}
            <div className="flex items-center gap-1">
              {m.payment_status === "confirmed"
                ? <CheckCircle2 size={11} style={{ color: "rgba(34,197,94,0.7)" }} />
                : <Clock size={11} style={{ color: "rgba(239,68,68,0.6)" }} />}
              <span style={{ fontSize: 9, color: m.payment_status === "confirmed" ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.6)" }}>
                {m.payment_status === "confirmed" ? "PAID" : "PENDING"}
              </span>
            </div>

            {/* Courier */}
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
              {m.courier_status === "in_transit"
                ? <span style={{ color: "rgba(59,130,246,0.8)" }}>IN TRANSIT</span>
                : m.courier_status === "delivered"
                  ? <span style={{ color: "rgba(34,197,94,0.7)" }}>DELIVERED</span>
                  : m.courier_status === "n_a"
                    ? <span style={{ color: "rgba(255,255,255,0.2)" }}>N/A</span>
                    : <span>NOT SHIPPED</span>}
              {m.tracking_number && (
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{m.tracking_number}</div>
              )}
            </div>

            {/* Packet score */}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: packetScoreColor(m.packet_score) }} />
              <span style={{ fontSize: 10, color: packetScoreColor(m.packet_score), fontVariantNumeric: "tabular-nums" }}>
                {m.packet_score !== null ? `${m.packet_score}%` : "—"}
              </span>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-1">
              {m.flags.length === 0
                ? <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)" }}>CLEAR</span>
                : m.flags.map((f) => (
                  <span key={f} className="px-1 py-0.5 rounded-sm"
                    style={{ fontSize: 7, background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.7)", letterSpacing: "0.1em", border: "1px solid rgba(239,68,68,0.15)" }}>
                    {f.replace(/_/g, " ").toUpperCase()}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer count */}
      <div className="mt-3 flex items-center justify-between">
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.15em" }}>
          {filtered.length} OF {DEMO.length} MATTERS · DATA SCOPE: MATTER ENFORCED
        </span>
        <span style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.15em" }}>
          THE MILANO SEAL™
        </span>
      </div>
    </div>
  );
}
