"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMilanoReducedMotion } from "@/lib/motion/use-milano-reduced-motion";
import { ArrowRight, BriefcaseBusiness, Route, Workflow } from "lucide-react";

const SPINE = [
  {
    index: "01",
    title: "Matter",
    eyebrow: "Canonical Truth",
    description:
      "Intake, review, payment truth, Matter state, evidence, exceptions and recovery stay anchored to one canonical Matter.",
    href: "/dashboard/deals",
    cta: "Open Matters",
    icon: BriefcaseBusiness,
    chips: ["Intake", "Review", "Wise truth", "Evidence", "Recovery"],
  },
  {
    index: "02",
    title: "Execution",
    eyebrow: "Governed Progression",
    description:
      "Scheduling, RON, apostille/authentication, translation, custody, release and completion move only through existing execution authority.",
    href: "/dashboard/scheduling-readiness",
    cta: "Open Execution",
    icon: Workflow,
    chips: ["Scheduling", "RON", "Apostille", "Custody", "Release"],
  },
  {
    index: "03",
    title: "Corridor",
    eyebrow: "Origin → Destination",
    description:
      "Destination authority, freshness, pathway, partner capacity, economics and scale posture explain where Milano can execute confidently.",
    href: "/dashboard/corridors",
    cta: "Open Corridor Command",
    icon: Route,
    chips: ["Authority", "Freshness", "Capacity", "Economics", "Scale"],
  },
] as const;

const LENSES = [
  ["Professional360", "/dashboard/professional360"],
  ["Economics", "/dashboard/economics"],
  ["Recovery", "/dashboard/recovery"],
  ["Trust", "/dashboard/trust"],
  ["Alliance", "/dashboard/alliance/quality"],
] as const;

export function MatterExecutionCorridorSpine() {
  const reduceMotion = useMilanoReducedMotion();

  return (
    <section className="mx-auto mt-7 max-w-7xl px-4 sm:px-0">
      <div className="relative overflow-hidden rounded-3xl border border-[#C6A55A]/16 bg-[#070707] p-5 sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(198,165,90,0.11),transparent_31%),radial-gradient(circle_at_85%_100%,rgba(198,165,90,0.07),transparent_30%)]" />

        <div className="relative flex flex-col gap-5 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#C6A55A]/58">
              Operating Spine
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light text-[#F6F1E6] sm:text-4xl">
              Matter <span className="text-[#C6A55A]/70">→</span> Execution <span className="text-[#C6A55A]/70">→</span> Corridor
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/40">
              The Milano Seal operates from one Matter, through governed execution, into a destination corridor. Everything else is a read-only or supporting intelligence lens around that spine.
            </p>
          </div>
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/24">
            TRUTH → STATE → DECISION → OUTCOME → LEARNING
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 lg:grid-cols-3">
          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-8 hidden h-px overflow-hidden bg-white/[0.05] lg:block">
            <motion.div
              className="h-full w-1/3 bg-[linear-gradient(90deg,transparent,#C6A55A,transparent)]"
              initial={{ x: "-100%" }}
              animate={reduceMotion ? { x: "0%" } : { x: ["-100%", "300%"] }}
              transition={reduceMotion ? { duration: 0 } : { duration: 3.6, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {SPINE.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.title}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.06 }}
                className="relative rounded-2xl border border-white/[0.07] bg-black/25 p-5 transition duration-150 hover:border-[#C6A55A]/24 hover:bg-[#C6A55A]/[0.025]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#C6A55A]/48">{item.index} · {item.eyebrow}</p>
                    <h3 className="mt-2 font-serif text-2xl text-white/88">{item.title}</h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C6A55A]/14 bg-[#C6A55A]/[0.035]">
                    <Icon className="h-4 w-4 text-[#C6A55A]/72" />
                  </div>
                </div>

                <p className="mt-4 min-h-[72px] text-[12px] leading-5 text-white/38">{item.description}</p>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {item.chips.map((chip) => (
                    <span key={chip} className="rounded-full border border-white/[0.055] bg-white/[0.018] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.11em] text-white/30">
                      {chip}
                    </span>
                  ))}
                </div>

                <Link href={item.href} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#C6A55A]/18 px-3.5 py-2 font-mono text-[8px] uppercase tracking-[0.13em] text-[#DCC47F]/72 transition duration-150 hover:border-[#C6A55A]/38 hover:text-[#F2DEAA]">
                  {item.cta}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </motion.article>
            );
          })}
        </div>

        <div className="relative mt-5 flex flex-col gap-3 rounded-2xl border border-white/[0.055] bg-white/[0.012] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.17em] text-white/24">Supporting intelligence lenses</p>
            <p className="mt-1 text-[11px] text-white/32">They explain the spine. They do not replace Matter or execution authority.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LENSES.map(([label, href]) => (
              <Link key={label} href={href} className="rounded-full border border-white/[0.06] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em] text-white/36 transition duration-150 hover:border-[#C6A55A]/25 hover:text-[#E4CA8C]">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
