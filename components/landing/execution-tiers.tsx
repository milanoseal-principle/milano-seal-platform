"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Signature",
    tagline: "Standard Bureau Filing & International Release",
    timeline: "Standard State Processing + Selected International Transit",
    description:
      "Designed for non-urgent international documents where standard state processing is appropriate. The matter is reviewed, prepared, submitted through the applicable state route, and released internationally once authentication is complete.",
    features: [
      "Remote Online Notarization",
      "State authentication channel routing",
      "Digital document delivery",
      "International release coordination",
      "Document scope review",
    ],
    highlight: false,
  },
  {
    name: "Priority",
    tagline: "Capital Desk Coordination // Priority International Release",
    timeline: "Accelerated State Handoff + Selected Express Transit",
    description:
      "Designed for matters requiring faster movement into the state authentication channel. Documents are prepared, reviewed, and coordinated for accelerated state-facing submission, followed by priority international release once the authenticated document is returned.",
    features: [
      "Everything in Signature",
      "Accelerated state-facing submission",
      "Selected express transit",
      "Priority international release",
      "Matter status updates",
    ],
    highlight: true,
  },
  {
    name: "Executive",
    tagline: "Executive State Handling // Priority Global Release",
    timeline: "Highest-Touch State Coordination + Priority International Transit",
    description:
      "Designed for urgent or high-liability international matters requiring founder-level oversight, direct coordination, and heightened chain-of-custody control. This lane prioritizes the preparation, submission, monitoring, and release sequence while preserving destination-specific review requirements.",
    features: [
      "Everything in Priority",
      "Founder-level oversight",
      "Chain-of-custody control",
      "Destination-specific review",
      "Direct mobile access",
      "After-hours availability",
    ],
    highlight: false,
  },
];

export function ExecutionTiers() {
  return (
    <section className="relative py-24 md:py-32 bg-[#050507]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#C6A55A] text-sm font-medium tracking-wider uppercase mb-4 block">
            Execution Lanes
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Choose Your Execution Level
          </h2>
          <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
            Select the lane that matches your matter's timeline and handling requirements.
          </p>
        </motion.div>

        {/* Tiers grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative group ${
                tier.highlight ? "md:-mt-4 md:mb-4" : ""
              }`}
            >
              {/* Highlight badge */}
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-4 py-1 text-xs font-medium text-[#0A0A0A] bg-[#C6A55A] rounded-full">
                    Most Requested
                  </span>
                </div>
              )}

              <div
                className={`bg-[#111111] border rounded-xl p-8 h-full transition-all duration-300 ${
                  tier.highlight
                    ? "border-[#C6A55A]/50 gold-glow"
                    : "border-[#2A2A2A] hover:border-[#C6A55A]/30 gold-glow-hover"
                }`}
              >
                {/* Header */}
                <div className="mb-5">
                  <h3 className="font-serif text-2xl font-medium text-white mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-[#C6A55A] leading-snug">{tier.tagline}</p>
                </div>

                {/* Timeline anchor */}
                <div className="mb-5 px-3 py-2 bg-black/40 border border-white/[0.05] rounded-lg">
                  <span className="font-mono text-[9px] tracking-[0.22em] uppercase text-[#555] block mb-1">
                    Timeline Anchor
                  </span>
                  <span className="font-mono text-[10px] text-[#888] leading-snug">
                    {tier.timeline}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[#B0B0B0] text-sm leading-relaxed mb-7">
                  {tier.description}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-[#C6A55A] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[#B0B0B0]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={`/intake?tier=${tier.name.toLowerCase()}`}
                  className={`group/btn w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    tier.highlight
                      ? "bg-[#C6A55A] text-[#0A0A0A] hover:bg-[#D4B76A]"
                      : "bg-[#1A1A1A] text-white border border-[#2A2A2A] hover:border-[#C6A55A]/50 hover:bg-[#C6A55A]/10"
                  }`}
                >
                  <span>Select {tier.name}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-[#B0B0B0]/60 mt-12"
        >
          Pricing provided upon intake completion. Add-ons available for
          apostille coordination, urgent handling, and additional signers.
        </motion.p>
      </div>
    </section>
  );
}
