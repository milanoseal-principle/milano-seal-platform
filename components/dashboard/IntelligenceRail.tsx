"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;

// Countries with dedicated /countries/[slug] authority pages
const COUNTRY_PAGES = new Set(["italy", "spain", "germany", "portugal", "uae", "mexico"]);

function countryPath(slug: string) {
  return COUNTRY_PAGES.has(slug) ? `/countries/${slug}` : `/apostille/${slug}`;
}

const STRATEGIC_CORRIDORS = [
  { origin: "Florida", destination: "Italy",               slug: "italy",         workflow: "Hague Route Validated",                    proceduralState: "Apostille Active" },
  { origin: "Florida", destination: "United Arab Emirates", slug: "uae",          workflow: "Consular Authentication Workflow",          proceduralState: "Embassy Processing" },
  { origin: "Florida", destination: "Brazil",              slug: "brazil",        workflow: "Document Authentication Sequence",          proceduralState: "Registry Alignment" },
  { origin: "Florida", destination: "United Kingdom",      slug: "united-kingdom", workflow: "Hague Apostille Track",                   proceduralState: "UK Receiving Authority Review" },
  { origin: "Florida", destination: "Spain",               slug: "spain",         workflow: "Bilateral Protocol Verification",           proceduralState: "Spanish Authority Review" },
  { origin: "Florida", destination: "Japan",               slug: "japan",         workflow: "Ministry of Foreign Affairs Track",         proceduralState: "Authentication Confirmed" },
  { origin: "Florida", destination: "Portugal",            slug: "portugal",      workflow: "Sovereign Legalization Track",              proceduralState: "Portuguese Authority Review" },
  { origin: "Florida", destination: "France",              slug: "france",        workflow: "European Civil Code Alignment",             proceduralState: "French Authority Review" },
  { origin: "Florida", destination: "Germany",             slug: "germany",       workflow: "Federal Authority Attestation",             proceduralState: "German Authority Review" },
  { origin: "Florida", destination: "Greece",              slug: "greece",        workflow: "Hague Consular Validation",                 proceduralState: "Protocol Instantiated" },
  { origin: "Florida", destination: "Mexico",              slug: "mexico",        workflow: "Notarial Protocol Integration",             proceduralState: "Apostille Validated" },
  { origin: "Florida", destination: "Canada",              slug: "canada",        workflow: "Global Affairs Authentication",             proceduralState: "Federal Attestation" },
  { origin: "Florida", destination: "Argentina",           slug: "argentina",     workflow: "Ministry of Foreign Affairs Verification",  proceduralState: "Escribano Verification" },
  { origin: "Florida", destination: "Saudi Arabia",        slug: "saudi-arabia",  workflow: "Consular Legalization Protocol",            proceduralState: "Ministry Clearance" },
  { origin: "Florida", destination: "Australia",           slug: "australia",     workflow: "DFAT Apostille Verification",               proceduralState: "International Release" },
  { origin: "Florida", destination: "Philippines",         slug: "philippines",   workflow: "DFA Departmental Authentication",           proceduralState: "Authentication Complete" },
];

export function IntelligenceRail() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % STRATEGIC_CORRIDORS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = STRATEGIC_CORRIDORS[index];

  return (
    <div
      className="w-full border-b border-[#1A1A1A] bg-[#050505]/80 backdrop-blur-md py-2.5 px-4 select-none flex-shrink-0"
      style={{ backdropFilter: "blur(8px)" }}
    >
      {/* Desktop */}
      <div className="hidden md:grid grid-cols-3 max-w-full items-center text-[10px] font-mono tracking-wider uppercase">
        <div className="flex items-center gap-2 text-[#4A4A4A]">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span>Global Document Intelligence</span>
        </div>

        <div className="text-center text-[#555]">
          <AnimatePresence mode="wait">
            <motion.span
              key={`wf-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.52, ease: EASE }}
            >
              {current.workflow}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-end gap-2 text-[#555]">
          <span>{current.origin}</span>
          <span className="text-[#C6A55A]/60">→</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={`dest-${index}`}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.52, ease: EASE }}
            >
              <Link
                href={countryPath(current.slug)}
                className="text-[#D0D0D0] hover:text-[#C6A55A] transition-colors duration-300"
                prefetch={false}
              >
                {current.destination}
              </Link>
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.span
              key={`state-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.52, ease: EASE }}
              className="text-[8.5px] bg-[#111] border border-[#222] text-[#555] px-1.5 py-0.5 rounded ml-1 normal-case tracking-normal font-sans"
            >
              {current.proceduralState}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile — entire row is a tappable link to the active corridor's country page */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`mob-row-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="md:hidden"
        >
          <Link
            href={countryPath(current.slug)}
            prefetch={false}
            className="flex items-center justify-between text-[9px] font-mono tracking-widest uppercase min-h-[48px]"
          >
            <div className="flex items-center gap-1.5 text-[#4A4A4A]">
              <motion.span
                className="h-1 w-1 rounded-full bg-emerald-500"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span>Global Document Intel</span>
            </div>
            <div className="flex items-center gap-1 text-[#D0D0D0]">
              <span className="text-[#888]">FL</span>
              <span className="text-[#C6A55A]/60">→</span>
              <span>{current.destination}</span>
            </div>
            <span className="text-[#4A4A4A] normal-case tracking-normal font-sans text-[8px]">
              {current.proceduralState}
            </span>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
