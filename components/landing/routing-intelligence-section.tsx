"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Globe2, Send, Compass, FileCheck, Landmark, ShieldCheck } from "lucide-react";

const CORRIDORS = [
  {
    origin: "Florida",
    destination: "Italy",
    label: "Hague Convention Validation Route",
    href: "/apostille/italy",
    icon: Globe2,
  },
  {
    origin: "Florida",
    destination: "Spain",
    label: "Apostille Review Pathway",
    href: "/apostille/spain",
    icon: Send,
  },
  {
    origin: "Florida",
    destination: "UAE",
    label: "Consular Authentication Workflow",
    href: "/apostille/uae",
    icon: Compass,
  },
  {
    origin: "Florida",
    destination: "Brazil",
    label: "International Release Corridor",
    href: "/apostille/brazil",
    icon: FileCheck,
  },
  {
    origin: "Florida",
    destination: "Mexico",
    label: "Hague Apostille Review Path",
    href: "/apostille/mexico",
    icon: Landmark,
  },
  {
    origin: "Florida",
    destination: "Portugal",
    label: "Hague Apostille Review Path",
    href: "/apostille/portugal",
    icon: Globe2,
  },
  {
    origin: "Florida",
    destination: "Greece",
    label: "Hague Convention Document Route",
    href: "/apostille/greece",
    icon: ShieldCheck,
  },
];

export function RoutingIntelligenceSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      id="routing-intelligence"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="w-full border-t border-[#1A1A1A] bg-[#060606] py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">

        {/* Eyebrow + headline */}
        <div className="mb-8">
          <p className="text-[10px] font-mono tracking-[0.08em] uppercase text-[#D4AF37]/70 mb-2">
            Global Routing Intelligence
          </p>
          <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-white">
            Priority Destination Corridors
          </h2>
          <p className="mt-2 text-sm text-[#6A6A6A] max-w-xl leading-relaxed">
            Active document execution pathways from Florida into high-demand international jurisdictions.
          </p>
        </div>

        {/* Desktop: all 6 cards in a row */}
        <div className="hidden md:grid md:grid-cols-7 border border-[#1A1A1A] rounded-xl overflow-hidden">
          {CORRIDORS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.destination}
                href={c.href}
                prefetch={false}
                className="group relative flex flex-col gap-2 px-5 py-5 border-r border-[#1A1A1A] last:border-r-0 transition-colors duration-300 hover:bg-[#0D0D0D]"
                aria-label={`View ${c.destination} document execution requirements`}
              >
                {/* Active status dot */}
                <motion.span
                  className="absolute top-3 right-3 w-1 h-1 rounded-full bg-amber-600/50"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                />

                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-[#3A3A3A] group-hover:text-[var(--ms-gold)] transition-colors duration-300 flex-shrink-0" />
                </div>

                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] tracking-[0.08em] uppercase text-[#8A8A8A] group-hover:text-[var(--ms-gold)] transition-colors duration-300 whitespace-nowrap">
                    {c.origin} → {c.destination}
                  </span>
                  <span className="mt-0.5 text-[8.5px] tracking-[0.12em] uppercase text-[#3A3A3A] group-hover:text-[#6A6A6A] transition-colors duration-300 whitespace-nowrap">
                    {c.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Mobile: horizontal scroll snap, 1.2 cards visible */}
        <div className="flex md:hidden gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 -mx-4 px-4">
          {CORRIDORS.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.destination}
                href={c.href}
                prefetch={false}
                className="group relative flex flex-col gap-2 flex-shrink-0 w-[52vw] snap-start border border-[#1A1A1A] rounded-xl px-4 py-4 bg-[#080808] hover:bg-[#0D0D0D] transition-colors duration-300"
                aria-label={`View ${c.destination} document execution requirements`}
              >
                <motion.span
                  className="absolute top-3 right-3 w-1 h-1 rounded-full bg-amber-600/50"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                />

                <Icon className="w-3.5 h-3.5 text-[#3A3A3A] group-hover:text-[var(--ms-gold)] transition-colors duration-300" />

                <span className="flex flex-col leading-tight mt-1">
                  <span className="text-[10px] tracking-[0.08em] uppercase text-[#8A8A8A] group-hover:text-[var(--ms-gold)] transition-colors duration-300">
                    {c.origin} → {c.destination}
                  </span>
                  <span className="mt-0.5 text-[8.5px] tracking-[0.12em] uppercase text-[#3A3A3A] group-hover:text-[#6A6A6A] transition-colors duration-300">
                    {c.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="mt-5 text-[10px] text-[#3A3A3A] leading-relaxed max-w-2xl">
          Displayed corridors represent priority routing pathways. Full destination review occurs during intake based on document type, issuing authority, and destination requirements.
        </p>

      </div>
    </motion.section>
  );
}
