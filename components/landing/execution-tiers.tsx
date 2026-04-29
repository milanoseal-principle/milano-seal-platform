"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Signature",
    tagline: "Standard Execution",
    description:
      "For straightforward document execution with standard timelines.",
    features: [
      "Remote Online Notarization",
      "Standard processing (5-7 days)",
      "Digital document delivery",
      "Email support",
      "Basic compliance check",
    ],
    highlight: false,
  },
  {
    name: "Priority",
    tagline: "Expedited Service",
    description: "For time-sensitive matters requiring accelerated handling.",
    features: [
      "Everything in Signature",
      "Priority processing (2-3 days)",
      "Physical & digital delivery",
      "Phone & WhatsApp support",
      "Enhanced compliance review",
      "Real-time status updates",
    ],
    highlight: true,
  },
  {
    name: "Executive",
    tagline: "Concierge Level",
    description:
      "For complex, high-value matters requiring white-glove service.",
    features: [
      "Everything in Priority",
      "Same-day execution available",
      "Dedicated liaison assigned",
      "Multi-document coordination",
      "Complex jurisdiction handling",
      "Direct mobile access",
      "After-hours availability",
    ],
    highlight: false,
  },
];

export function ExecutionTiers() {
  return (
    <section className="relative py-24 md:py-32 bg-[#0A0A0A]">
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
            Select the service tier that matches your timeline and complexity
            requirements.
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
                    Most Popular
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
                <div className="mb-6">
                  <h3 className="font-serif text-2xl font-medium text-white mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-[#C6A55A]">{tier.tagline}</p>
                </div>

                {/* Description */}
                <p className="text-[#B0B0B0] text-sm leading-relaxed mb-8">
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
