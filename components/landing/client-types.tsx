"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Scale, Building, Heart, Globe, User, ArrowRight } from "lucide-react";

const clientTypes = [
  {
    icon: Scale,
    title: "Attorneys",
    href: "/partners/attorneys",
    description:
      "Reliable execution for client matters requiring notarization and apostille services. We handle the procedural requirements so you can focus on legal strategy.",
  },
  {
    icon: Building,
    title: "Real Estate Professionals",
    href: "/partners/real-estate",
    description:
      "Closing documents, powers of attorney, and property-related executions with precision timing and location flexibility.",
  },
  {
    icon: Heart,
    title: "Medical Providers",
    href: "/partners/medical",
    description:
      "Healthcare directives, consent forms, and sensitive medical documents handled with discretion and HIPAA awareness.",
  },
  {
    icon: Globe,
    title: "International Clients",
    href: "/partners/international-clients",
    description:
      "Cross-border document coordination for individuals and businesses operating between the U.S. and foreign jurisdictions.",
  },
  {
    icon: User,
    title: "Private Clients",
    href: "/partners/private-clients",
    description:
      "Estate planning, personal legal documents, and family matters executed with the highest level of discretion and care.",
  },
];

export function ClientTypes() {
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
            Who We Serve
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 text-balance">
            Trusted by Professionals Worldwide
          </h2>
          <p className="text-[#B0B0B0] text-lg max-w-2xl mx-auto leading-relaxed">
            We coordinate the U.S. side of your matter with the precision and
            discretion your clients expect.
          </p>
        </motion.div>

        {/* Desktop: 2-col / 3-col grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {clientTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={index === clientTypes.length - 1 ? "lg:col-start-2" : ""}
            >
              <Link
                href={type.href}
                prefetch={false}
                className="group flex flex-col h-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-8 transition-all duration-300 hover:border-[#C6A55A]/30 gold-glow-hover"
              >
                <div className="inline-flex p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] mb-6 transition-all duration-300 group-hover:border-[#C6A55A]/30 group-hover:bg-[#C6A55A]/5 self-start">
                  <type.icon className="w-6 h-6 text-[#C6A55A]" />
                </div>

                <div className="flex items-start justify-between mb-3 flex-1">
                  <div>
                    <h3 className="font-serif text-xl font-medium text-white mb-3 group-hover:text-[#C6A55A] transition-colors duration-300">
                      {type.title}
                    </h3>
                    <p className="text-[#B0B0B0] text-sm leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#C6A55A]/30 group-hover:text-[#C6A55A] transition-all duration-300 group-hover:translate-x-1 flex-shrink-0 ml-4 mt-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Mobile: single-column vertical stack */}
        <div className="flex flex-col space-y-4 md:hidden touch-pan-y">
          {clientTypes.map((type, index) => (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <Link
                href={type.href}
                prefetch={false}
                className="flex items-center justify-between w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-5 active:bg-[#111] transition-colors duration-150 min-h-[64px]"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex-shrink-0">
                    <type.icon className="w-5 h-5 text-[#C6A55A]" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-medium text-white leading-tight">
                      {type.title}
                    </h4>
                    <p className="text-[#5A5A5A] text-xs mt-0.5 leading-snug line-clamp-1">
                      {type.description}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#C6A55A]/60 flex-shrink-0 ml-3" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
