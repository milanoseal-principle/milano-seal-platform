import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileScan,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { SectionReveal } from "@/components/motion/SectionReveal";
import {
  FIELD_VISIT_HARD_STOPS,
  FIELD_VISIT_PROTOCOL,
  FIELD_VISIT_PROTOCOL_SOURCE,
} from "@/lib/operations/field-visit-protocol";

export const dynamic = "force-dynamic";

const PHASES = [
  { key: "pre_visit", label: "Pre-Visit Lock", icon: ClipboardCheck },
  { key: "visit", label: "Visit Attempt", icon: MapPin },
  { key: "no_response", label: "No-Response Evidence", icon: Camera },
  { key: "second_visit", label: "Return Visit", icon: RotateCcw },
  { key: "completion", label: "Scanback & Originals", icon: PackageCheck },
] as const;

export default function FieldVisitsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <SectionReveal>
        <div className="relative overflow-hidden rounded-2xl border border-[#C6A55A]/20 bg-[#0B0B0D] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(198,165,90,0.10),transparent_34%)]" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C6A55A]">
                Internal · Source-Backed Field Protocol
              </p>
              <h1 className="font-serif text-3xl font-medium text-white sm:text-4xl">
                Field Visit Control
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                Governed residential-visit workflow for supplied signing assignments. This workspace converts real third-party order instructions into a repeatable Milano operator protocol without creating a second Matter, payment, scheduling, or notarial system.
              </p>
            </div>
            <div className="grid min-w-[260px] gap-2 text-xs text-white/50">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <span className="block text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/70">Source</span>
                <span className="mt-1 block">{FIELD_VISIT_PROTOCOL_SOURCE.sourceType}</span>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                <span className="block text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/70">Control Rule</span>
                <span className="mt-1 block">Matter-specific instructions always control.</span>
              </div>
            </div>
          </div>
        </div>
      </SectionReveal>

      <SectionReveal>
        <div className="grid gap-4 md:grid-cols-5">
          {PHASES.map((phase, index) => {
            const Icon = phase.icon;
            return (
              <div key={phase.key} className="relative rounded-xl border border-[#C6A55A]/15 bg-[#111113] p-4">
                {index < PHASES.length - 1 && (
                  <div className="absolute left-[calc(100%+1px)] top-7 hidden h-px w-4 bg-gradient-to-r from-[#C6A55A]/35 to-transparent md:block" />
                )}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C6A55A]/30 bg-[#C6A55A]/5 text-[#C6A55A]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">0{index + 1}</p>
                    <p className="text-xs font-medium text-white/80">{phase.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionReveal>

      <div className="space-y-5">
        {PHASES.map((phase) => {
          const Icon = phase.icon;
          const steps = FIELD_VISIT_PROTOCOL.filter((step) => step.phase === phase.key);
          return (
            <SectionReveal key={phase.key}>
              <section className="overflow-hidden rounded-2xl border border-white/8 bg-[#0F0F11]">
                <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4 sm:px-6">
                  <Icon className="h-4 w-4 text-[#C6A55A]" />
                  <h2 className="font-serif text-xl text-white">{phase.label}</h2>
                </div>
                <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
                  {steps.map((step) => (
                    <article key={step.id} className="rounded-xl border border-[#C6A55A]/10 bg-black/20 p-4 transition-colors hover:border-[#C6A55A]/25">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#C6A55A]/20 text-[#C6A55A]">
                          {step.hardStop ? <ShieldAlert className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white/90">{step.title}</h3>
                          <p className="mt-2 text-xs leading-6 text-white/50">{step.instruction}</p>
                          {step.evidence && (
                            <p className="mt-3 border-l border-[#C6A55A]/25 pl-3 text-[11px] leading-5 text-[#D8C188]/70">
                              Evidence: {step.evidence}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </SectionReveal>
          );
        })}
      </div>

      <SectionReveal>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-red-400/15 bg-red-500/[0.025] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-red-200/80">
              <ShieldAlert className="h-4 w-4" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">Hard Stops</h2>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {FIELD_VISIT_HARD_STOPS.map((rule) => (
                <div key={rule} className="rounded-lg border border-red-400/10 bg-black/15 px-3 py-2 text-xs leading-5 text-white/55">
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#C6A55A]/15 bg-[#111113] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[#C6A55A]">
              <FileScan className="h-4 w-4" />
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em]">Operator Routing</h2>
            </div>
            <p className="mt-3 text-xs leading-6 text-white/50">
              This protocol is reference logic only. Actual execution, evidence, payment, notarial truth, and release remain inside the existing canonical Matter controls.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/dashboard/deals" className="rounded-lg bg-[#C6A55A] px-4 py-2 text-xs font-semibold text-black transition hover:brightness-110">
                Open Matters
              </Link>
              <Link href="/dashboard/sops" className="rounded-lg border border-[#C6A55A]/30 px-4 py-2 text-xs font-medium text-[#D8C188] transition hover:bg-[#C6A55A]/5">
                SOP Library
              </Link>
            </div>
          </div>
        </div>
      </SectionReveal>
    </div>
  );
}
