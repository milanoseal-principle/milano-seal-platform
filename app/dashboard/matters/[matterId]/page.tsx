"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import {
  buildMatterTruthSections,
  deriveMatterCompleteness,
  findMatterDiscrepancies,
  type EvidenceState,
  type MatterTruthInput,
  type MatterTruthSection,
} from "@/lib/matter/matterTruthGovernance";

// Matter 360 — canonical object view.
// This surface is a READ PROJECTION over the same canonical read model used by
// Matter Truth (/api/deals/[id] + matterTruthGovernance). It creates no second
// Matter state, payment, scheduling or execution authority. Payment language is
// fail-closed: it never asserts "paid" and only reflects governance-derived state.

type DealRow = Record<string, unknown> & {
  id?: string;
  deal_id?: string;
  client_name?: string;
  professional_name?: string;
  destination_country?: string;
  document_type?: string;
  origin_state?: string;
  payment_status?: string;
  payment_settlement_status?: string;
  payment_observed_at?: string;
  amount_due?: number;
  amount_paid?: number;
  payment_reference?: string;
  scheduled_at?: string;
  executed_at?: string;
  apostille_at?: string;
  tracking_number?: string;
  carrier?: string;
  delivery_status?: string;
  delivered_at?: string;
  delivery_at?: string;
  completed_at?: string;
  is_paid_and_released?: boolean;
  execution_method?: string;
  notarial_act?: string;
  competent_authority?: string;
  updated_at?: string;
};

function toTruthInput(row: DealRow, matterId: string): MatterTruthInput {
  const numeric = (value: unknown) =>
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() && Number.isFinite(Number(value))
        ? Number(value)
        : null;
  return {
    matterId,
    clientName: row.client_name ?? null,
    destinationCountry: row.destination_country ?? null,
    documentType: row.document_type ?? null,
    originState: row.origin_state ?? null,
    executionMethod: row.execution_method ?? null,
    notarialAct: row.notarial_act ?? null,
    competentAuthority: row.competent_authority ?? null,
    authorityStatus: row.competent_authority ? "verified" : "unknown",
    paymentStatus: row.payment_status ?? null,
    paymentSettlementStatus: row.payment_settlement_status ?? null,
    amountDue: numeric(row.amount_due),
    amountPaid: numeric(row.amount_paid),
    wiseReference: row.payment_reference ?? null,
    scheduledAt: row.scheduled_at ?? null,
    executionCompletedAt: row.executed_at ?? null,
    apostilleStatus: row.apostille_at ? "in_progress" : null,
    carrier: row.carrier ?? null,
    trackingNumber: row.tracking_number ?? null,
    deliveryStatus: row.delivery_status ?? null,
    deliveryTimestamp: row.delivered_at ?? row.delivery_at ?? null,
    releaseVerified: row.is_paid_and_released === true,
    completedAt: row.completed_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

// Canonical lifecycle stages mapped to the derived truth sections. No new truth
// is invented — each stage reflects the state the governance lib already derived.
const LIFECYCLE: { key: string; label: string; sectionId: MatterTruthSection["id"] }[] = [
  { key: "intake", label: "Intake", sectionId: "identity" },
  { key: "review", label: "Review", sectionId: "documents" },
  { key: "payment", label: "Payment Authority", sectionId: "payment" },
  { key: "execution", label: "Execution", sectionId: "execution" },
  { key: "apostille", label: "Apostille", sectionId: "authority" },
  { key: "custody", label: "Custody", sectionId: "custody" },
  { key: "release", label: "Release", sectionId: "release" },
  { key: "delivered", label: "Delivered", sectionId: "delivery" },
  { key: "closed", label: "Closed", sectionId: "completion" },
];

const STATE_TONE: Record<EvidenceState | "COMPLETE" | "NOT_APPLICABLE", string> = {
  VERIFIED: "text-emerald-300 border-emerald-300/25 bg-emerald-300/5",
  COMPLETE: "text-emerald-300 border-emerald-300/25 bg-emerald-300/5",
  BLOCKED: "text-red-300 border-red-300/25 bg-red-300/5",
  REVIEW_REQUIRED: "text-amber-300 border-amber-300/25 bg-amber-300/5",
  STALE: "text-orange-300 border-orange-300/25 bg-orange-300/5",
  INCOMPLETE: "text-white/45 border-white/12 bg-white/[0.02]",
  NOT_APPLICABLE: "text-white/30 border-white/8 bg-white/[0.01]",
};

export default function Matter360Page() {
  const params = useParams<{ matterId: string }>();
  const matterId = params?.matterId ?? "";
  const reduceMotion = useReducedMotion();

  const [row, setRow] = useState<DealRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matterId) return;
    let active = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const response = await fetch(`/api/deals/${encodeURIComponent(matterId)}`, { cache: "no-store" });
        if (active) setStatus(response.status);
        if (!response.ok) throw new Error(`Matter read failed (${response.status})`);
        const data = (await response.json()) as DealRow;
        if (active) setRow(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load Matter.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [matterId]);

  const truth = useMemo(() => (row ? toTruthInput(row, matterId) : null), [row, matterId]);
  const sections = useMemo(() => (truth ? buildMatterTruthSections(truth) : []), [truth]);
  const completeness = useMemo(() => deriveMatterCompleteness(sections), [sections]);
  const discrepancies = useMemo(() => (truth ? findMatterDiscrepancies(truth) : []), [truth]);

  const sectionById = useMemo(() => {
    const map = new Map<string, MatterTruthSection>();
    // First section wins for a given id (matches truth-view ordering).
    for (const section of sections) if (!map.has(section.id)) map.set(section.id, section);
    return map;
  }, [sections]);

  const criticalBlocker = useMemo(() => {
    const critical = discrepancies.find((d) => d.severity === "CRITICAL");
    if (critical) return critical.blocker;
    const blocking = discrepancies.find((d) => d.severity === "BLOCKING");
    if (blocking) return blocking.blocker;
    const blocked = sections.find((s) => s.state === "BLOCKED" && s.blocker);
    if (blocked?.blocker) return blocked.blocker;
    const review = sections.find((s) => s.state === "REVIEW_REQUIRED" && s.blocker);
    return review?.blocker ?? null;
  }, [discrepancies, sections]);

  const unauthorized = status === 401 || status === 403;
  const notFound = status === 404;

  return (
    <main className="space-y-7 pb-16">
      <section className="rounded-3xl border border-[var(--ms-gold)]/20 bg-[#0d0d0d] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--ms-gold)]">Matter Control · Matter 360</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/30">
            Matter → Execution → Corridor
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-light text-white">{truth?.clientName ?? "Matter"}</h1>
            <p className="mt-2 font-mono text-sm text-white/50">{matterId || "—"}</p>
          </div>
          {!loading && !error ? (
            <span
              className={`rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] ${STATE_TONE[completeness.overallState === "COMPLETE" ? "COMPLETE" : (completeness.overallState.replace("STALE_EVIDENCE", "STALE") as EvidenceState)] ?? STATE_TONE.INCOMPLETE}`}
            >
              {completeness.overallState.replaceAll("_", " ")}
            </span>
          ) : null}
        </div>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-white/55">
          The canonical object view for this Matter. It reads canonical Matter, execution, authority, Wise
          settlement, custody, courier, delivery and release evidence — it does not create a second Matter state
          or transaction authority.
        </p>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#111] p-6 text-sm text-white/50" role="status" aria-live="polite">
          Loading canonical Matter evidence…
        </div>
      ) : null}

      {unauthorized ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-300/5 p-6 text-sm text-amber-100">
          You are not authorized to view this Matter. Sign in with an operator account or request access.
        </div>
      ) : notFound ? (
        <div className="rounded-2xl border border-white/12 bg-[#0e0e0e] p-6 text-sm text-white/55">
          No Matter found for <span className="font-mono text-white/70">{matterId}</span>. It may have been closed,
          reassigned, or never existed.
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-sm text-red-200">{error}</div>
      ) : null}

      {!loading && !error && truth ? (
        <>
          {/* Canonical header facts */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Fact
              label="Client / Professional"
              value={
                row?.professional_name
                  ? `${truth.clientName ?? "Unresolved"} · ${row.professional_name}`
                  : truth.clientName ?? "Unresolved"
              }
            />
            <Fact label="Destination" value={truth.destinationCountry ?? "Unresolved"} />
            <Fact label="Document Type" value={truth.documentType ?? "Unresolved"} />
            <Fact label="Origin" value={truth.originState ?? "Unresolved"} />
            <Fact label="Execution Method" value={truth.executionMethod ?? "Not selected"} />
            <Fact label="Notarial Act" value={truth.notarialAct ?? "Not resolved"} />
            <Fact
              label="Payment / Scheduling Authority"
              value={paymentAuthorityLabel(sectionById.get("payment"), truth)}
              tone={sectionById.get("payment")?.state}
            />
            <Fact
              label="Critical Blocker"
              value={criticalBlocker ?? "None modeled"}
              tone={criticalBlocker ? "BLOCKED" : "VERIFIED"}
            />
          </section>

          {/* Lifecycle timeline */}
          <section className="rounded-3xl border border-white/[0.08] bg-[#0b0b0b] p-5 md:p-6">
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--ms-gold)]">Lifecycle</div>
            <h2 className="mt-1 font-serif text-2xl font-light text-white">Intake → Closed</h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9">
              {LIFECYCLE.map((stage, index) => {
                const section = sectionById.get(stage.sectionId);
                const state = section?.state ?? "INCOMPLETE";
                return (
                  <li
                    key={stage.key}
                    className={`relative rounded-xl border p-3 transition ${!reduceMotion ? "duration-150" : ""} ${STATE_TONE[state] ?? STATE_TONE.INCOMPLETE}`}
                  >
                    <div className="font-mono text-[9px] uppercase tracking-[0.16em] opacity-70">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/90">{stage.label}</div>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
                      {state.replaceAll("_", " ")}
                    </div>
                    {section?.blocker ? (
                      <div className="mt-1.5 text-[10px] leading-4 opacity-80">{section.blocker}</div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Deep links to owning surfaces */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <NavCard href={`/dashboard/matters/${encodeURIComponent(matterId)}/truth`} title="Matter Truth" caption="Full canonical evidence, discrepancies and reconciliation." />
            <NavCard href={`/dashboard/matters/${encodeURIComponent(matterId)}/execution`} title="Execution Readiness" caption="Governed progression, gates and next action." />
            <NavCard href={`/dashboard/deals/${encodeURIComponent(matterId)}`} title="Matter Record" caption="Canonical Matter record and activity." />
          </section>

          {discrepancies.length ? (
            <section className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--ms-gold)]">Exceptions</div>
                <Link href="/dashboard/reconciliation" className="text-xs text-[var(--ms-gold)]">
                  Open Reconciliation Center →
                </Link>
              </div>
              <div className="mt-4 grid gap-2">
                {discrepancies.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/8 bg-black/25 p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{item.class.replaceAll("_", " ")}</span>
                      <span className={item.severity === "CRITICAL" ? "font-semibold text-red-300" : "font-semibold text-amber-300"}>
                        {item.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-white/55">{item.requiredAction}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </main>
  );
}

// Fail-closed payment authority language. Never asserts "paid" — reflects only the
// governance-derived section state (VERIFIED requires verified settlement + Wise reference).
function paymentAuthorityLabel(section: MatterTruthSection | undefined, truth: MatterTruthInput): string {
  const scheduled = Boolean(truth.scheduledAt);
  if (!section) return scheduled ? "Scheduling recorded · settlement unverified" : "Not recorded";
  if (section.state === "VERIFIED") return scheduled ? "Verified settlement · scheduling authority" : "Verified settlement";
  if (section.state === "REVIEW_REQUIRED") return "Payment submitted · verified settlement pending";
  return scheduled ? "Scheduling recorded · settlement unverified" : "No verified settlement";
}

function Fact({ label, value, tone }: { label: string; value: string; tone?: EvidenceState }) {
  const toneClass = tone ? STATE_TONE[tone] ?? "border-white/8 bg-black/25" : "border-white/8 bg-black/25";
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">{label}</div>
      <div className="mt-1.5 text-sm font-medium text-white/90">{value}</div>
    </div>
  );
}

function NavCard({ href, title, caption }: { href: string; title: string; caption: string }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/[0.08] bg-[#0e0e0e] p-5 transition duration-150 hover:border-[var(--ms-gold)]/30 hover:bg-[var(--ms-gold)]/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/50"
    >
      <div className="text-lg font-semibold text-white/90 group-hover:text-white">{title}</div>
      <p className="mt-1.5 text-xs leading-5 text-white/45">{caption}</p>
      <span className="mt-3 inline-flex text-xs font-medium text-[var(--ms-gold)]">Open →</span>
    </Link>
  );
}
