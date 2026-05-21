"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Submit Your Matter",
    description:
      "Provide document details and destination requirements through our secure intake process.",
  },
  {
    number: "02",
    title: "Compliance Review",
    description:
      "Jurisdiction requirements are validated and the optimal execution path is determined.",
  },
  {
    number: "03",
    title: "Payment-Gated Execution",
    description:
      "No matter is scheduled or executed until scope is confirmed and payment is complete.",
    highlight: true,
  },
  {
    number: "04",
    title: "Document Execution",
    description:
      "Your documents are executed with precision, recorded, and sealed according to Florida law.",
  },
  {
    number: "05",
    title: "Chain-of-Custody Visibility",
    description:
      "Apostille coordination and structured international release handled through proper authority channels.",
  },
  {
    number: "06",
    title: "Structured International Release",
    description:
      "Receive your executed documents digitally and physically, ready for international use.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 md:py-32 bg-[#111111]">
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
            Execution Path Preview
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            How It Works
          </h2>
          <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
            Executed properly the first time. Cross-border execution with U.S.
            compliance standards.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className={`bg-[#0A0A0A] border rounded-xl p-8 h-full transition-all duration-300 gold-glow-hover${(step as { highlight?: boolean }).highlight ? " border-[#C6A55A]/25 bg-[#0D0B08]" : " border-[#2A2A2A] hover:border-[#C6A55A]/30"}`}>
                {/* Step number + optional lock icon for payment gate */}
                <div className="flex items-start justify-between">
                  <span className="font-serif text-4xl font-medium text-[#C6A55A]/20 group-hover:text-[#C6A55A]/40 transition-colors duration-300">
                    {step.number}
                  </span>
                  {(step as { highlight?: boolean }).highlight && (
                    <Lock className="ms-lock-icon w-4 h-4 text-[#C6A55A] mt-2 opacity-70" />
                  )}
                </div>

                {/* Content */}
                <h3 className="font-serif text-xl font-medium text-white mt-4 mb-3">
                  {step.title}
                </h3>
                <p className="text-[#B0B0B0] text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector line (hidden on mobile) */}
              {index < steps.length - 1 && (index + 1) % 3 !== 0 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-[#2A2A2A] to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
