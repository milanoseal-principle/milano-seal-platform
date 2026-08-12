"use client";

/**
 * ProcurementCommandCenter — operator surface for the Universal Procurement
 * Engine, rendered inside the EXISTING /dashboard/government route (not a new
 * dashboard). Reuses canonical procurement modules and the real Pinellas record.
 *
 * Honest by construction: sections with no real data show explicit empty states
 * rather than fabricated records. Real vs sample data is always labelled.
 * Responsive: tabs wrap on desktop and collapse to a select on mobile; tables
 * render as stacked cards on small screens.
 */

import { useState } from "react";
import { PINELLAS_ITQ_250786 } from "@/lib/government/submissions/pinellasItq250786";
import { listRealSubmissions } from "@/lib/procurement/submissions/submissionRegistry";
import { REFERENCE_REGISTRY } from "@/lib/procurement/references/referenceConsentTracker";
import { INSURANCE_REGISTRY } from "@/lib/procurement/readiness/insuranceRegistry";
import { PROCUREMENT_RATE_MODELS } from "@/lib/procurement/pricing/procurementPricingAdapter";
import { assembleProposalOutline } from "@/lib/procurement/proposals/proposalSectionRegistry";
import { PROCUREMENT_SAFETY_NOTICE } from "@/lib/procurement/procurementSafety";

const SECTIONS = [
  "Today", "Opportunities", "Bid Decisions", "Compliance", "Proposal Workspace",
  "Pricing", "References", "Insurance & Readiness", "Vendor Registrations",
  "Submissions", "Contracts", "Relationships", "Events", "Knowledge Base",
  "Recorded Submissions",
] as const;
type Section = (typeof SECTIONS)[number];

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</p>
    </div>
  );
}

function RealBadge() {
  return (
    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-300/80">
      Real data
    </span>
  );
}

export function ProcurementCommandCenter() {
  const [active, setActive] = useState<Section>("Recorded Submissions");
  const pin = PINELLAS_ITQ_250786;
  const realSubmissions = listRealSubmissions();

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">Procurement Command Center</p>
          <h3 className="font-serif text-lg text-white">Government &amp; Institutional Procurement</h3>
        </div>
      </div>

      {/* Mobile: select. Desktop: wrapping tab row. */}
      <div className="mb-4">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as Section)}
          className="w-full rounded-lg border border-white/[0.1] bg-[#050507] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 sm:hidden"
          aria-label="Procurement section"
        >
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={`min-h-9 rounded-lg border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                active === s
                  ? "border-[var(--ms-gold)]/55 bg-[var(--ms-gold)]/[0.08] text-[var(--ms-gold)]"
                  : "border-white/[0.06] text-white/45 hover:border-[var(--ms-gold)]/25 hover:text-white/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[220px]">
        {active === "Today" && (
          <div className="grid gap-2">
            <Empty label="No urgent procurement actions recorded" />
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">Next action surfaces here once opportunities are recorded.</p>
          </div>
        )}
        {active === "Opportunities" && <Empty label="No verified opportunities recorded" />}
        {active === "Bid Decisions" && <Empty label="No open bid/no-bid decisions" />}
        {active === "Compliance" && <Empty label="No active compliance matrices" />}
        {active === "Proposal Workspace" && (
          <div className="grid gap-1.5">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Canonical proposal outline</p>
            {assembleProposalOutline([
              "executive_summary", "business_profile", "scope_response",
              "operational_workflow", "quality_assurance", "compliance_matrix",
              "pricing_narrative", "references", "insurance", "commitment_to_performance",
            ]).map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2">
                <span className="text-[12px] text-white/70">{s.title}</span>
                <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/35">
                  {s.agencySpecific ? "Per opportunity" : "Reusable"}
                </span>
              </div>
            ))}
          </div>
        )}
        {active === "Pricing" && (
          <div className="grid gap-1.5">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Rate models · operator-prepared (no auto public price)</p>
            {PROCUREMENT_RATE_MODELS.map((m) => (
              <div key={m.model} className="flex items-center justify-between rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2">
                <span className="text-[12px] text-white/70">{m.label}</span>
                {m.passThrough && <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/35">Pass-through · no markup</span>}
              </div>
            ))}
          </div>
        )}
        {active === "References" && (
          REFERENCE_REGISTRY.length === 0 ? <Empty label="No reference consent confirmed" /> : null
        )}
        {active === "Insurance & Readiness" && (
          INSURANCE_REGISTRY.length === 0 ? <Empty label="Insurance evidence pending verification" /> : null
        )}
        {active === "Vendor Registrations" && <Empty label="No verified vendor registrations recorded" />}
        {active === "Submissions" && (
          <div className="grid gap-2">
            {realSubmissions.map((s) => (
              <div key={s.id} className="flex flex-col gap-1 rounded-lg border border-white/[0.06] bg-white/[0.015] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[12px] text-white/75">{s.agencyName} · {s.solicitationNumber}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber-300/80">Submitted · Not Awarded</span>
              </div>
            ))}
          </div>
        )}
        {active === "Contracts" && <Empty label="No active contracts · no award evidence recorded" />}
        {active === "Relationships" && <Empty label="No verified agency contact recorded" />}
        {active === "Events" && <Empty label="No procurement events recorded" />}
        {active === "Knowledge Base" && <Empty label="Knowledge base grows from recorded submissions" />}

        {active === "Recorded Submissions" && (
          <article className="rounded-xl border border-[var(--ms-gold)]/20 bg-[#050507] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-[var(--ms-gold)]/60">{pin.agencyName} · {pin.solicitationNumber}</p>
                <h4 className="font-serif text-base text-white">{pin.solicitationTitle}</h4>
              </div>
              <div className="flex items-center gap-2">
                <RealBadge />
                <span className="rounded-full border border-amber-500/30 bg-amber-500/[0.08] px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-amber-300/80">Submitted · Not Awarded</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Bid scope</p>
                <ul className="space-y-1">
                  {pin.bidScope.map((b, i) => <li key={i} className="text-[11px] leading-snug text-white/60">• {b}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Declined (no-bid)</p>
                <ul className="space-y-1">
                  {pin.declinedScope.map((b, i) => <li key={i} className="text-[11px] leading-snug text-white/45">• {b}</li>)}
                </ul>
              </div>
            </div>

            {/* Rate schedule — stacked cards on mobile, row on desktop */}
            <div className="mt-3">
              <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Section 7 rate schedule</p>
              <div className="grid gap-1.5">
                {pin.rateSchedule.map((r) => (
                  <div key={r.line} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2">
                    <span className="text-[11px] text-white/65">{r.line}. {r.description}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-white/80">{r.rate}</span>
                      <span className={`font-mono text-[8px] uppercase tracking-[0.12em] ${r.decision === "BID" ? "text-emerald-300/80" : "text-white/35"}`}>{r.decision === "BID" ? "BID" : "NO-BID"}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">Contract term: {pin.contractTermMonths} months</p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Outstanding items</p>
                <ul className="space-y-1">
                  {pin.openItems.map((o, i) => <li key={i} className="text-[11px] leading-snug text-white/50">• {o}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.16em] text-white/35">Lessons learned</p>
                <ul className="space-y-1">
                  {pin.lessonsLearned.map((o, i) => <li key={i} className="text-[11px] leading-snug text-white/50">• {o}</li>)}
                </ul>
              </div>
            </div>

            <p className="mt-3 border-t border-white/[0.06] pt-2 font-mono text-[8px] leading-relaxed text-white/30">{pin.disclaimers.join(" ")}</p>
          </article>
        )}
      </div>

      <p className="mt-4 font-mono text-[8px] leading-relaxed text-white/25">{PROCUREMENT_SAFETY_NOTICE}</p>
    </section>
  );
}
