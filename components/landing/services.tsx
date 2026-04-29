"use client";

import { motion } from "framer-motion";
import { Monitor, FileCheck, Globe2, Car } from "lucide-react";

const services = [
  {
    icon: Monitor,
    title: "Remote Online Notarization (RON)",
    description:
      "Secure, identity-verified digital notarization compliant with Florida law, valid for domestic and international use when accepted by receiving authority.",
    features: [
      "Identity verification",
      "Audio-video recording",
      "Tamper-evident seal",
      "Immediate delivery",
    ],
  },
  {
    icon: FileCheck,
    title: "Apostille Coordination",
    description:
      "End-to-end handling of document authentication through the appropriate Secretary of State, ensuring Hague Convention compliance for international acceptance.",
    features: [
      "State authentication",
      "Hague compliance",
      "Tracking provided",
      "Global recognition",
    ],
  },
  {
    icon: Globe2,
    title: "International Document Execution",
    description:
      "Structured preparation, notarization, and coordination of U.S. documents intended for foreign jurisdictions.",
    features: [
      "Jurisdiction analysis",
      "Document structuring",
      "Compliance verification",
      "Destination guidance",
    ],
  },
  {
    icon: Car,
    title: "Mobile Notary",
    description:
      "In-person execution for high-sensitivity, high-value, or location-restricted matters.",
    features: [
      "On-location service",
      "Flexible scheduling",
      "Witness coordination",
      "Same-day available",
    ],
  },
];

export function Services() {
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

        {/* Services grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-[#111111] border border-[#2A2A2A] rounded-xl p-8 transition-all duration-500 hover:border-[#C6A55A]/30 gold-glow-hover"
            >
              {/* Icon */}
              <div className="inline-flex p-3 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] mb-6 transition-all duration-300 group-hover:border-[#C6A55A]/30 group-hover:bg-[#C6A55A]/5">
                <service.icon className="w-6 h-6 text-[#C6A55A]" />
              </div>

              {/* Content */}
              <h3 className="font-serif text-xl md:text-2xl font-medium text-white mb-4 group-hover:text-[#C6A55A] transition-colors duration-300">
                {service.title}
              </h3>
              <p className="text-[#B0B0B0] leading-relaxed mb-6">
                {service.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 text-xs font-medium text-[#B0B0B0] bg-[#1A1A1A] border border-[#2A2A2A] rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Hover accent */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/0 to-transparent group-hover:via-[#C6A55A]/50 transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
