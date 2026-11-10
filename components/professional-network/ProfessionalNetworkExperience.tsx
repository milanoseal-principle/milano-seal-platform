"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Network, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { PROFESSIONAL_NETWORK_LANES, PROFESSIONAL_NETWORK_PRINCIPLES } from "@/data/professional-network";

const ease = [0.16, 1, 0.3, 1] as const;

const laneIcon = {
  counsel: BriefcaseBusiness,
  execution: ShieldCheck,
  operations: Workflow,
} as const;

export function ProfessionalNetworkExperience() {
  const reduce = useMilanoReducedMotion();

  return (
    <div className="relative overflow-hidden bg-[#050507] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(198,166,91,0.16),transparent_34%),radial-gradient(circle_at_90%_20%,rgba(198,166,91,0.08),transparent_26%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: reduce ? 0.01 : 0.65, ease }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C6A65A]/25 bg-[#C6A65A]/[0.05] px-3.5 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#DCC58C]">
            <Network className="h-3.5 w-3.5" />
            The Milano Seal Professional Network™
          </div>
          <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-[1.03] text-[#F6F1E6] sm:text-5xl lg:text-7xl">
            One execution infrastructure. <span className="italic text-[#C6A65A]">Three professional lanes.</span>
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/52 sm:text-lg">
            Counsel brings legal strategy. Execution partners bring verified capability. Milano Execution Coordinators keep the operating system moving. Every lane works from the same governed Matter truth.
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.45, delay: reduce ? 0 : 0.15, ease }}
          className="mt-8 grid gap-2 rounded-2xl border border-white/[0.06] bg-black/30 p-3 sm:grid-cols-3"
        >
          {["COUNSEL → MATTER ORIGINATION", "MILANO → GOVERNED EXECUTION", "NETWORK → VERIFIED DELIVERY"].map((item, index) => (
            <div key={item} className="flex min-h-12 items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4">
              <span className="font-mono text-[9px] text-[#C6A65A]/60">0{index + 1}</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/42">{item}</span>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 xl:grid-cols-3">
          {PROFESSIONAL_NETWORK_LANES.map((lane, index) => {
            const Icon = laneIcon[lane.id];
            return (
              <motion.article
                key={lane.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: reduce ? 0.01 : 0.5, delay: reduce ? 0 : index * 0.07, ease }}
                className="group relative overflow-hidden rounded-3xl border border-[#C6A65A]/16 bg-[linear-gradient(180deg,rgba(15,15,17,0.96),rgba(7,7,8,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] sm:p-7"
              >
                <div aria-hidden="true" className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#C6A65A]/70 to-transparent" />
                <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-[#C6A65A]/[0.06] blur-3xl transition duration-500 group-hover:bg-[#C6A65A]/[0.11]" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C6A65A]/25 bg-[#C6A65A]/[0.055] text-[#DCC58C]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="rounded-full border border-white/[0.06] bg-black/35 px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.14em] text-white/28">Professional Lane</div>
                </div>

                <div className="relative mt-6">
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A65A]/62">{lane.eyebrow}</div>
                  <h2 className="mt-2 font-serif text-2xl text-[#F6F1E6]">{lane.title}</h2>
                  <div className="mt-3 inline-flex rounded-lg border border-[#C6A65A]/18 bg-[#C6A65A]/[0.04] px-3 py-2 text-[11px] font-medium text-[#D8C48E]">Designation: {lane.designation}</div>
                  <p className="mt-5 text-sm leading-6 text-white/42">{lane.audience}</p>
                  <p className="mt-4 border-l border-[#C6A65A]/30 pl-4 text-sm leading-6 text-white/62">{lane.promise}</p>
                </div>

                <div className="relative mt-6 border-t border-white/[0.055] pt-5">
                  <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/28">Network value</div>
                  <div className="mt-4 grid gap-2">
                    {lane.value.slice(0, 6).map((item) => (
                      <div key={item} className="flex min-h-10 items-center gap-2.5 rounded-lg border border-white/[0.045] bg-white/[0.015] px-3 text-[12px] text-white/48">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#C6A65A]/72" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative mt-6 rounded-xl border border-white/[0.055] bg-black/25 p-4">
                  <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/24">Why join</div>
                  <div className="mt-3 space-y-2">
                    {lane.outcomes.map((item) => <div key={item} className="text-[12px] leading-5 text-white/48">— {item}</div>)}
                  </div>
                </div>

                <Link href={lane.href} className="relative mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#C6A65A]/30 bg-[#C6A65A]/[0.07] px-5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#E1CC96] transition hover:border-[#C6A65A]/60 hover:bg-[#C6A65A]/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A65A]/60">
                  {lane.cta}<ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <p className="relative mt-4 text-[10px] leading-5 text-white/24">{lane.note}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-[#C6A65A]/18 bg-[linear-gradient(135deg,rgba(198,166,90,0.07),rgba(255,255,255,0.015)_42%,rgba(0,0,0,0.34))] p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.19em] text-[#C6A65A]/65"><Sparkles className="h-3.5 w-3.5" />Network doctrine</div>
              <h2 className="mt-4 font-serif text-3xl text-[#F6F1E6] sm:text-4xl">Prestige comes from verified contribution, not a decorative badge.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/42">Milano designations are earned inside the network from identity, readiness, role, compliance, and performance posture. They never replace state commissions, legal credentials, government authority, or professional licensing.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PROFESSIONAL_NETWORK_PRINCIPLES.map((item) => (
                <div key={item} className="flex min-h-14 items-center gap-3 rounded-xl border border-white/[0.055] bg-black/25 px-4 text-[12px] text-white/48">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#C6A65A]/70" />{item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
