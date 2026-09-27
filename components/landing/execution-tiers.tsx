"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";

const scopes = [
  {
    name: "Signature",
    eyebrow: "Governed Standard Scope",
    description:
      "For a Matter that can move through the standard governed execution path after document, signer, jurisdiction, destination, and authority requirements are reviewed.",
    features: [
      "Structured Matter review",
      "Applicable execution-method coordination",
      "Apostille or authentication pathway review when required",
      "Governed custody and release controls",
    ],
  },
  {
    name: "Priority",
    eyebrow: "Elevated Coordination Scope",
    description:
      "For a Matter requiring additional coordination, urgency handling, or execution complexity beyond the standard path. Priority is assigned from reviewed Matter facts—not selected as a checkout upgrade.",
    features: [
      "Everything operationally applicable from Signature",
      "Elevated coordination and monitoring",
      "Urgency and routing complexity considered in review",
      "Matter-specific release planning",
    ],
  },
  {
    name: "Executive",
    eyebrow: "Highest-Control Scope",
    description:
      "For high-complexity, high-touch, or institutionally sensitive Matters requiring greater founder oversight, custody control, coordination, or bespoke execution planning.",
    features: [
      "Everything operationally applicable from Priority",
      "Founder-level oversight where appropriate",
      "Heightened custody and exception control",
      "Custom execution planning when standard routing is insufficient",
    ],
  },
] as const;

export function ExecutionTiers() {
  return (
    <section
      aria-labelledby="execution-scope-heading"
      className="relative overflow-hidden border-y border-white/[0.055] bg-[#070707] px-4 py-16 sm:px-6 md:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(198,166,91,0.09), transparent 32rem)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#C6A65B]/70">
            How Milano Scopes Execution
          </p>
          <h2
            id="execution-scope-heading"
            className="mt-4 font-serif text-4xl leading-tight text-white sm:text-5xl md:text-6xl"
          >
            Three execution scopes. <em className="text-[#C6A65B]">Assigned after review.</em>
          </h2>
          <p className="mt-5 text-base leading-7 text-white/48">
            Signature, Priority, and Executive are governed execution scopes inside the Milano pricing and operations system. They are not self-selected service packages and they do not create fixed completion promises.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {scopes.map((scope, index) => (
            <motion.article
              key={scope.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="relative overflow-hidden rounded-[1.6rem] border border-white/[0.07] bg-[#0B0B0B]/94 p-6 shadow-[0_26px_80px_rgba(0,0,0,0.3)] sm:p-7"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(198,166,91,0.55), transparent)",
                }}
              />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A65B]/55">
                    {scope.eyebrow}
                  </p>
                  <h3 className="mt-2 font-serif text-3xl text-[#F6F1E6]">{scope.name}</h3>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#C6A65B]/20 bg-[#C6A65B]/[0.055] text-[#C6A65B]">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </span>
              </div>

              <p className="mt-5 min-h-[7.5rem] text-sm leading-6 text-white/46">{scope.description}</p>

              <ul className="mt-6 space-y-3 border-t border-white/[0.055] pt-5">
                {scope.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-white/55">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-[#C6A65B]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-[1.4rem] border border-[#C6A65B]/15 bg-[#C6A65B]/[0.035] px-5 py-5 text-center sm:flex-row sm:text-left">
          <p className="max-w-3xl text-sm leading-6 text-white/45">
            Milano determines the execution scope only after reviewing the Matter. Final pricing, timing posture, execution method, authority path, courier requirements, and release conditions remain Matter-specific.
          </p>
          <Link
            href="/intake?source=pricing&intent=scope-review"
            className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C6A65B]/30 px-5 text-sm font-medium text-[#E7CD87] transition-colors hover:border-[#C6A65B]/60 hover:bg-[#C6A65B]/[0.06]"
          >
            Begin Matter Review
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
