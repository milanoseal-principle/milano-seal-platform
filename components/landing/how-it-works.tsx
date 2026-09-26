"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { usePublicTranslations } from "@/components/i18n/PublicI18nProvider";

const STEP_META = [
  { number: "01", href: "/intake", highlight: false },
  { number: "02", href: "/process#compliance-review", highlight: false },
  { number: "03", href: "/process#payment-gate", highlight: true },
  { number: "04", href: "/process#execution", highlight: false },
  { number: "05", href: "/process#custody", highlight: false },
  { number: "06", href: "/process#release", highlight: false },
] as const;

export function HowItWorks() {
  const { t } = usePublicTranslations();
  const steps = STEP_META.map((meta, index) => ({ ...meta, ...t.process.steps[index] }));
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
          <span className="text-[var(--ms-gold)] text-sm font-medium tracking-wider uppercase mb-4 block">
            {t.process.eyebrow}
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            {t.process.title}
          </h2>
          <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
            {t.process.summary}
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
              <Link
                href={step.href}
                className={`block bg-[#0A0A0A] border rounded-xl p-8 h-full transition-all duration-300 gold-glow-hover ${step.highlight ? " border-[var(--ms-gold)]/25 bg-[#0D0B08] hover:border-[var(--ms-gold)]/50" : " border-[#2A2A2A] hover:border-[var(--ms-gold)]/30"}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-serif text-4xl font-medium text-[var(--ms-gold)]/20 group-hover:text-[var(--ms-gold)]/40 transition-colors duration-300">
                    {step.number}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    {step.highlight && (
                      <Lock className="ms-lock-icon w-4 h-4 text-[var(--ms-gold)] opacity-70" />
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--ms-gold)]/20 group-hover:text-[var(--ms-gold)]/60 transition-all duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>

                <h3 className="font-serif text-xl font-medium text-white mt-4 mb-3 group-hover:text-[var(--ms-gold)] transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-[#B0B0B0] text-sm leading-relaxed">
                  {step.description}
                </p>
              </Link>

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
