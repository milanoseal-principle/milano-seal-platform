import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  FileCheck2,
  Landmark,
  Mail,
  ReceiptText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { SectionReveal } from "@/components/motion/SectionReveal";
import {
  ITALY_RECORD_OPERATOR_GATES,
  VASTOGIRARDI_ATTACHMENTS,
  VASTOGIRARDI_DELIVERY_METHODS,
  VASTOGIRARDI_HISTORICAL_FEES,
  VASTOGIRARDI_RECORD_OPTIONS,
  VASTOGIRARDI_RECORD_SOURCE,
  VASTOGIRARDI_REQUEST_DATA,
  VASTOGIRARDI_SOURCE_RULES,
} from "@/lib/intelligence/italy-municipal-records";

export const dynamic = "force-dynamic";

export default function ItalyRecordsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <SectionReveal>
        <div className="relative overflow-hidden rounded-2xl border border-[#C6A55A]/20 bg-[#0B0B0D] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(198,165,90,0.11),transparent_36%)]" />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C6A55A]">
                Internal · Authority-Source Intelligence
              </p>
              <h1 className="font-serif text-3xl font-medium text-white sm:text-4xl">
                Italy Municipal Records Desk
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
                Source-specific operating profile derived from the Comune di Vastogirardi historical civil-status request form. Use it to structure a Matter and evidence checklist—not as a universal rule for Italy or as legal advice.
              </p>
            </div>
            <div className="rounded-xl border border-amber-300/15 bg-amber-400/[0.035] px-4 py-3 text-xs leading-5 text-amber-100/65 lg:max-w-sm">
              <div className="flex items-center gap-2 font-semibold uppercase tracking-[0.15em] text-amber-200/80">
                <AlertTriangle className="h-3.5 w-3.5" />
                Verify Before Use
              </div>
              <p className="mt-2">
                Confirm the current form, fee, eligibility requirements, and submission method with the actual Comune holding the record.
              </p>
            </div>
          </div>
        </div>
      </SectionReveal>

      <SectionReveal>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#111113] p-5">
            <Landmark className="h-5 w-5 text-[#C6A55A]" />
            <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-white/30">Authority Profile</p>
            <p className="mt-1 font-serif text-xl text-white">{VASTOGIRARDI_RECORD_SOURCE.comune}</p>
            <p className="mt-1 text-xs text-white/45">Provincia di {VASTOGIRARDI_RECORD_SOURCE.province}</p>
          </div>
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#111113] p-5">
            <Mail className="h-5 w-5 text-[#C6A55A]" />
            <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-white/30">Authority Contact</p>
            <p className="mt-1 break-all text-xs text-white/70">{VASTOGIRARDI_RECORD_SOURCE.ordinaryEmail}</p>
            <p className="mt-1 break-all text-xs text-white/45">PEC: {VASTOGIRARDI_RECORD_SOURCE.pecEmail}</p>
          </div>
          <div className="rounded-xl border border-[#C6A55A]/15 bg-[#111113] p-5">
            <Archive className="h-5 w-5 text-[#C6A55A]" />
            <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-white/30">Source Scope</p>
            <p className="mt-1 text-xs leading-6 text-white/55">{VASTOGIRARDI_RECORD_SOURCE.scopeNote}</p>
          </div>
        </div>
      </SectionReveal>

      <SectionReveal>
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0F0F11]">
          <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4 sm:px-6">
            <FileCheck2 className="h-4 w-4 text-[#C6A55A]" />
            <div>
              <h2 className="font-serif text-xl text-white">Record Types on the Source Form</h2>
              <p className="mt-0.5 text-[10px] text-white/35">13 authority-listed request options</p>
            </div>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            {VASTOGIRARDI_RECORD_OPTIONS.map((option) => (
              <div key={option.id} className="rounded-xl border border-[#C6A55A]/10 bg-black/20 p-4">
                <div className="flex gap-3">
                  <span className="font-mono text-[10px] text-[#C6A55A]">{String(option.id).padStart(2, "0")}</span>
                  <div>
                    <p className="text-sm text-white/80">{option.label}</p>
                    {option.requiresRelationshipProof && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#C6A55A]/15 bg-[#C6A55A]/5 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-[#D8C188]/70">
                        <UsersRound className="h-3 w-3" /> Relationship proof listed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </SectionReveal>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionReveal>
          <section className="h-full rounded-2xl border border-white/8 bg-[#0F0F11] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[#C6A55A]">
              <FileCheck2 className="h-4 w-4" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">Request Data Checklist</h2>
            </div>
            <div className="mt-4 space-y-2">
              {VASTOGIRARDI_REQUEST_DATA.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-white/6 bg-black/15 px-3 py-2.5 text-xs leading-5 text-white/55">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#C6A55A]/70" />
                  {item}
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>

        <SectionReveal>
          <section className="h-full rounded-2xl border border-white/8 bg-[#0F0F11] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[#C6A55A]">
              <Archive className="h-4 w-4" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">Listed Attachments</h2>
            </div>
            <div className="mt-4 space-y-2">
              {VASTOGIRARDI_ATTACHMENTS.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-white/6 bg-black/15 px-3 py-2.5 text-xs leading-5 text-white/55">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#C6A55A]/70" />
                  {item}
                </div>
              ))}
            </div>
          </section>
        </SectionReveal>
      </div>

      <SectionReveal>
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-2xl border border-[#C6A55A]/15 bg-[#111113] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[#C6A55A]">
              <ReceiptText className="h-4 w-4" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">Historical Record Fee Table</h2>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-white/35">Source-form amounts. Re-verify before quoting or submission.</p>
            <div className="mt-4 space-y-3">
              {VASTOGIRARDI_HISTORICAL_FEES.map((fee) => (
                <div key={fee.amountEur} className="grid gap-3 rounded-xl border border-[#C6A55A]/10 bg-black/20 p-4 sm:grid-cols-[90px_1fr] sm:items-center">
                  <div className="font-serif text-2xl text-[#D8C188]">€{fee.amountEur}</div>
                  <p className="text-xs leading-6 text-white/50">{fee.condition}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#C6A55A]/15 bg-[#111113] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[#C6A55A]">
              <Mail className="h-4 w-4" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">Delivery Methods Listed</h2>
            </div>
            <div className="mt-4 space-y-2">
              {VASTOGIRARDI_DELIVERY_METHODS.map((method) => (
                <div key={method} className="rounded-lg border border-white/6 bg-black/15 px-3 py-3 text-xs text-white/55">
                  {method}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-5 text-white/35">
              Delivery channel is an authority-request option, not proof that a specific record or certified copy will be accepted for the client's downstream use.
            </p>
          </section>
        </div>
      </SectionReveal>

      <SectionReveal>
        <section className="rounded-2xl border border-white/8 bg-[#0F0F11] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[#C6A55A]">
            <Landmark className="h-4 w-4" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">Source-Derived Administrative Rules</h2>
          </div>
          <div className="mt-4 grid gap-2 lg:grid-cols-2">
            {VASTOGIRARDI_SOURCE_RULES.map((rule) => (
              <div key={rule} className="rounded-xl border border-white/6 bg-black/15 p-4 text-xs leading-6 text-white/50">
                {rule}
              </div>
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal>
        <section className="rounded-2xl border border-emerald-300/10 bg-emerald-400/[0.025] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-emerald-200/75">
            <ShieldCheck className="h-4 w-4" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">Operator Gates</h2>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {ITALY_RECORD_OPERATOR_GATES.map((gate) => (
              <div key={gate} className="rounded-lg border border-emerald-300/8 bg-black/15 px-3 py-3 text-xs leading-5 text-white/55">
                {gate}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard/countries" className="rounded-lg border border-[#C6A55A]/30 px-4 py-2 text-xs font-medium text-[#D8C188] transition hover:bg-[#C6A55A]/5">
              Country Intelligence
            </Link>
            <Link href="/dashboard/deals" className="rounded-lg bg-[#C6A55A] px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110">
              Open Matters
            </Link>
          </div>
        </section>
      </SectionReveal>
    </div>
  );
}
