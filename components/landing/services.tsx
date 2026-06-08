"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Monitor, FileCheck, Globe2, Car, ArrowRight } from "lucide-react";

type FeatureWithTooltip = { label: string; tooltip: string };

const services: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  features: FeatureWithTooltip[];
}[] = [
  {
    icon: Monitor,
    title: "Remote Online Notarization Coordination",
    href: "/services/remote-online-notary",
    description:
      "Florida Remote Online Notarization support for eligible documents, including identity verification workflow coordination, signer readiness review, session preparation, and post-execution document QA before apostille or release movement.",
    features: [
      { label: "Identity verification workflow", tooltip: "Multi-factor identity verification performed through approved RON platform procedures." },
      { label: "Signer readiness review", tooltip: "" },
      { label: "Session preparation", tooltip: "" },
      { label: "Post-execution QA", tooltip: "" },
    ],
  },
  {
    icon: FileCheck,
    title: "Hague Apostille Coordination",
    href: "/services/apostille",
    description:
      "Document routing support for Hague Convention countries, including notarization review, state or federal apostille pathway review, destination-country awareness, courier custody, and receiving-authority sensitivity checks.",
    features: [
      { label: "Apostille pathway review", tooltip: "Document sequencing verified directly with the Florida Department of State division." },
      { label: "Destination-country awareness", tooltip: "Destination-country routing reviewed against Hague Convention authentication requirements." },
      { label: "Courier custody", tooltip: "" },
      { label: "Receiving-authority checks", tooltip: "" },
    ],
  },
  {
    icon: Globe2,
    title: "Non-Hague Authentication & Legalization Review",
    href: "/services/international-execution",
    description:
      "Structured routing review for documents intended for non-Hague jurisdictions that may require state authentication, federal review, embassy or consular legalization, translation review, or specialized release handling.",
    features: [
      { label: "State authentication review", tooltip: "" },
      { label: "Federal review pathway", tooltip: "" },
      { label: "Embassy/consular legalization", tooltip: "" },
      { label: "Translation review support", tooltip: "" },
    ],
  },
  {
    icon: Car,
    title: "Executive Document Logistics",
    href: "/services/mobile-notary",
    description:
      "High-control support for private-client, corporate, estate, maritime, equestrian, luxury asset, and international transaction documents requiring careful intake, document packet review, chain-of-custody awareness, and release coordination.",
    features: [
      { label: "High-control intake", tooltip: "" },
      { label: "Document packet review", tooltip: "" },
      { label: "Chain-of-custody awareness", tooltip: "" },
      { label: "Release coordination", tooltip: "" },
    ],
  },
];

function FeaturePill({ label, tooltip }: FeatureWithTooltip) {
  return (
    <span className="relative group/pill pointer-events-none md:pointer-events-auto">
      <span className="px-3 py-1 text-xs font-medium text-[#B0B0B0] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full inline-block">
        {label}
      </span>
      {tooltip && (
        <span className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 text-[10px] leading-relaxed text-[#B0B0B0] bg-[#111] border border-[#2A2A2A] rounded-lg px-3 py-2 opacity-0 group-hover/pill:opacity-100 transition-opacity duration-200 pointer-events-none z-20 text-left normal-case font-sans tracking-normal">
          {tooltip}
        </span>
      )}
    </span>
  );
}

export function Services() {
  return (
    <section className="relative pt-10 pb-24 md:pt-14 md:pb-32 bg-[#050507]">
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050507] to-transparent pointer-events-none" />
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
            Our Services
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Comprehensive Document Execution
          </h2>
          <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
            High-trust document handling for international acceptance.
            Discretion and compliance at every step.
          </p>
        </motion.div>

        {/* Desktop: 2-column grid */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <Link
                href={service.href}
                className="group relative bg-[#111111] border border-[#2A2A2A] rounded-xl p-8 transition-all duration-500 hover:border-[#C6A55A]/30 gold-glow-hover flex flex-col h-full"
              >
                <div className="inline-flex p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] mb-6 transition-all duration-300 group-hover:border-[#C6A55A]/30 group-hover:bg-[#C6A55A]/5 self-start">
                  <service.icon className="w-6 h-6 text-[#C6A55A]" />
                </div>

                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-serif text-xl md:text-2xl font-medium text-white group-hover:text-[#C6A55A] transition-colors duration-300 pr-4">
                    {service.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-[#C6A55A]/40 group-hover:text-[#C6A55A] transition-all duration-300 group-hover:translate-x-1 flex-shrink-0 mt-1.5" />
                </div>

                <p className="text-[#B0B0B0] leading-relaxed mb-6 flex-1">
                  {service.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {service.features.map((f) => (
                    <FeaturePill key={f.label} label={f.label} tooltip={f.tooltip} />
                  ))}
                </div>

                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/0 to-transparent group-hover:via-[#C6A55A]/50 transition-all duration-500" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile: horizontal snap rail */}
        <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-none gap-4 px-0 pb-4 touch-pan-x">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex-shrink-0 w-[85vw] snap-center"
            >
              <Link
                href={service.href}
                className="group block bg-[#111111] border border-[#2A2A2A] rounded-xl p-6 h-full active:scale-[0.98] transition-transform duration-150"
              >
                <div className="inline-flex p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] mb-5">
                  <service.icon className="w-5 h-5 text-[#C6A55A]" />
                </div>

                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-serif text-lg font-medium text-white pr-3">
                    {service.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-[#C6A55A]/60 flex-shrink-0 mt-0.5" />
                </div>

                <p className="text-[#B0B0B0] text-sm leading-relaxed mb-4">
                  {service.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pointer-events-none">
                  {service.features.map((f) => (
                    <span
                      key={f.label}
                      className="px-2.5 py-1 text-[11px] font-medium text-[#B0B0B0] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full"
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
