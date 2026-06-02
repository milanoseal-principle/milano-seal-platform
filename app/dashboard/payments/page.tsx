"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PaymentRow {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  matter_ref: string | null;
  tier: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  wise_reference: string | null;
  payment_confirmed_at: string | null;
  created_at: string | null;
  status: string | null;
}

interface WebhookEvent {
  event_type: string;
  processed: boolean;
  processing_error: string | null;
  received_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  paid:             { label: "Confirmed",         color: "#3FA47A", bg: "rgba(63,164,122,0.08)" },
  pending:          { label: "Pending",            color: "#C6A55A", bg: "rgba(198,165,90,0.08)" },
  partial:          { label: "Partial",            color: "#C99A3D", bg: "rgba(201,154,61,0.08)" },
  review_required:  { label: "Review Required",   color: "#B85C5C", bg: "rgba(184,92,92,0.08)" },
  failed:           { label: "Failed",             color: "#B85C5C", bg: "rgba(184,92,92,0.08)" },
  refunded:         { label: "Refunded",           color: "#B85C5C", bg: "rgba(184,92,92,0.08)" },
  unpaid:           { label: "Awaiting Payment",  color: "rgba(198,165,90,0.4)", bg: "transparent" },
};

const SECTION_ORDER = [
  "review_required",
  "partial",
  "pending",
  "unpaid",
  "paid",
  "failed",
  "refunded",
];

const SECTION_LABELS: Record<string, string> = {
  review_required: "Review Required",
  partial:         "Partial Payments",
  pending:         "Payment Pending",
  unpaid:          "Awaiting Payment",
  paid:            "Payment Confirmed",
  failed:          "Failed",
  refunded:        "Refunded",
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function money(n: number | null) {
  if (n === null || n === undefined) return "—";
  return `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/payments")
      .then((r) => r.json() as Promise<{ payments: PaymentRow[]; webhook_events: WebhookEvent[]; notice?: string }>)
      .then((d) => {
        setPayments(d.payments ?? []);
        setWebhookEvents(d.webhook_events ?? []);
        setNotice(d.notice ?? null);
      })
      .catch(() => setNotice("Unable to load payment data"))
      .finally(() => setLoading(false));
  }, []);

  const grouped = SECTION_ORDER.reduce<Record<string, PaymentRow[]>>((acc, key) => {
    acc[key] = payments.filter((p) => (p.payment_status ?? "unpaid") === key);
    return acc;
  }, {});

  const reviewCount = grouped["review_required"]?.length ?? 0;
  const partialCount = grouped["partial"]?.length ?? 0;
  const pendingCount = grouped["pending"]?.length ?? 0;

  return (
    <div style={{ padding: "32px 28px", background: "#050505", minHeight: "100vh", color: "#f6f1e6" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", marginBottom: 6 }}>
          / PAYMENTS /
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: "#f6f1e6", margin: 0 }}>
          Payment Review Center
        </h1>
        <p style={{ fontSize: 12, color: "rgba(198,165,90,0.45)", marginTop: 6 }}>
          Wise-confirmed payments only. No scheduling without confirmation.
        </p>
      </div>

      {/* Attention strip */}
      {(reviewCount > 0 || partialCount > 0) && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {reviewCount > 0 && (
            <button
              onClick={() => setActiveSection(activeSection === "review_required" ? null : "review_required")}
              style={{ padding: "8px 14px", background: "rgba(184,92,92,0.1)", border: "1px solid rgba(184,92,92,0.35)", borderRadius: 3, color: "#B85C5C", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
            >
              {reviewCount} Review Required
            </button>
          )}
          {partialCount > 0 && (
            <button
              onClick={() => setActiveSection(activeSection === "partial" ? null : "partial")}
              style={{ padding: "8px 14px", background: "rgba(201,154,61,0.1)", border: "1px solid rgba(201,154,61,0.3)", borderRadius: 3, color: "#C99A3D", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
            >
              {partialCount} Partial
            </button>
          )}
          {pendingCount > 0 && (
            <button
              onClick={() => setActiveSection(activeSection === "pending" ? null : "pending")}
              style={{ padding: "8px 14px", background: "rgba(198,165,90,0.08)", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 3, color: "#C6A55A", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer" }}
            >
              {pendingCount} Pending
            </button>
          )}
        </div>
      )}

      {notice && (
        <div style={{ padding: "12px 16px", background: "rgba(198,165,90,0.06)", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 4, marginBottom: 24, fontSize: 12, color: "rgba(198,165,90,0.75)", lineHeight: 1.6 }}>
          <strong style={{ color: "#C6A55A" }}>Notice:</strong> {notice}
        </div>
      )}

      {loading && (
        <div style={{ fontSize: 12, color: "rgba(198,165,90,0.35)", fontFamily: "monospace", padding: "20px 0" }}>
          Loading payments…
        </div>
      )}

      {/* Payment sections */}
      {SECTION_ORDER.map((key) => {
        const rows = grouped[key] ?? [];
        if (rows.length === 0) return null;
        if (activeSection && activeSection !== key) return null;
        const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG["unpaid"];

        return (
          <div key={key} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color }} />
              <span style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: cfg.color }}>
                {SECTION_LABELS[key]} ({rows.length})
              </span>
              {activeSection === key && (
                <button
                  onClick={() => setActiveSection(null)}
                  style={{ marginLeft: "auto", fontSize: 9, color: "rgba(198,165,90,0.4)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em" }}
                >
                  SHOW ALL
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rows.map((row) => (
                <div
                  key={row.id}
                  style={{
                    padding: "14px 16px",
                    background: key === "review_required" ? "rgba(184,92,92,0.04)" : "#0B0B0B",
                    border: `1px solid ${key === "review_required" ? "rgba(184,92,92,0.25)" : "rgba(198,165,90,0.1)"}`,
                    borderRadius: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  {/* Left — matter identity */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 180 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f6f1e6" }}>
                      {row.client_name ?? "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(198,165,90,0.5)", fontFamily: "monospace" }}>
                      {row.deal_id ?? row.id.slice(0, 8)}
                    </div>
                    {row.tier && (
                      <div style={{ fontSize: 9, color: "rgba(198,165,90,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {row.tier.replace(/_/g, " ")}
                      </div>
                    )}
                  </div>

                  {/* Center — amounts */}
                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "rgba(198,165,90,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>Due</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#f6f1e6", fontFamily: "monospace" }}>{money(row.amount_due)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(198,165,90,0.25)" }}>→</div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "rgba(198,165,90,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>Paid</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: row.amount_paid ? "#3FA47A" : "rgba(198,165,90,0.3)", fontFamily: "monospace" }}>
                        {money(row.amount_paid)}
                      </div>
                    </div>
                  </div>

                  {/* Right — status + actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{
                      fontSize: 9,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      padding: "3px 9px",
                      border: `1px solid ${cfg.color}44`,
                      borderRadius: 2,
                      color: cfg.color,
                      background: cfg.bg,
                    }}>
                      {cfg.label}
                    </div>

                    {row.payment_method && (
                      <div style={{ fontSize: 9, color: "rgba(198,165,90,0.4)", fontFamily: "monospace", textTransform: "uppercase" }}>
                        {row.payment_method}
                      </div>
                    )}

                    <div style={{ fontSize: 9, color: "rgba(198,165,90,0.3)" }}>
                      {fmt(row.payment_confirmed_at ?? row.created_at)}
                    </div>

                    <div style={{ display: "flex", gap: 5 }}>
                      <Link
                        href={`/dashboard/deals/${row.id}`}
                        style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(198,165,90,0.7)", textDecoration: "none", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 2 }}
                      >
                        Matter
                      </Link>
                      {(row.wise_reference ?? row.payment_reference) && (
                        <button
                          onClick={() => {
                            const ref = row.wise_reference ?? row.payment_reference ?? "";
                            navigator.clipboard.writeText(ref).catch(() => null);
                          }}
                          style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(198,165,90,0.7)", background: "none", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(198,165,90,0.15)", borderRadius: 2, cursor: "pointer" }}
                          title={row.wise_reference ?? row.payment_reference ?? ""}
                        >
                          Copy Ref
                        </button>
                      )}
                      {key === "review_required" && (
                        <Link
                          href={`/dashboard/deals/${row.id}`}
                          style={{ fontSize: 9, letterSpacing: "0.12em", color: "#B85C5C", textDecoration: "none", textTransform: "uppercase", padding: "3px 8px", border: "1px solid rgba(184,92,92,0.3)", borderRadius: 2 }}
                        >
                          Reconcile
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!loading && payments.length === 0 && (
        <div style={{ fontSize: 12, color: "rgba(198,165,90,0.35)", padding: "60px 0", textAlign: "center", border: "1px solid rgba(198,165,90,0.1)", borderRadius: 4 }}>
          No payment records yet.
        </div>
      )}

      {/* Webhook events */}
      {webhookEvents.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.4)", marginBottom: 12 }}>
            Recent Wise Webhook Events
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {webhookEvents.slice(0, 20).map((ev, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 14px",
                  background: "#0B0B0B",
                  border: `1px solid ${ev.processing_error ? "rgba(184,92,92,0.2)" : "rgba(198,165,90,0.08)"}`,
                  borderRadius: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(198,165,90,0.7)" }}>
                  {ev.event_type}
                </span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: ev.processed ? "#3FA47A" : "rgba(198,165,90,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {ev.processed ? "Processed" : "Pending"}
                  </span>
                  {ev.processing_error && (
                    <span style={{ fontSize: 9, color: "#B85C5C", fontFamily: "monospace", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.processing_error}
                    </span>
                  )}
                  <span style={{ fontSize: 9, color: "rgba(198,165,90,0.3)" }}>
                    {fmt(ev.received_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
