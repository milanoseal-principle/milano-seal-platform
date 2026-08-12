"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  X,
  ArrowRight,
  Shield,
  Clock,
  FileCheck,
  Globe,
  CheckCircle,
} from "lucide-react";

export interface CountryData {
  id: string;
  name: string;
  flag: string;
  tagline: string;
  seoFact: string;
  hagueSince: string;
  processingDays: string;
  jurisdiction: string;
  complianceBadges: string[];
  documentTypes: string[];
}

export const COUNTRY_COMPLIANCE_DATA: Record<string, CountryData> = {
  italy: {
    id: "italy",
    name: "Italy",
    flag: "🇮🇹",
    tagline: "Professional U.S. Document Corridor",
    seoFact:
      "Italy is a Contracting Party to the Hague Apostille Convention, effective February 11, 1978. The correct U.S. competent authority depends on the document origin and execution, and the receiving Italian authority may impose document-specific or translation requirements.",
    hagueSince: "1978",
    processingDays: "Authority-dependent",
    jurisdiction: "Civil Law · Notarial",
    complianceBadges: [
      "Hague Apostille",
      "Authority Review",
      "Receiving-Authority Check",
    ],
    documentTypes: [
      "Vital Records",
      "Corporate Records",
      "Powers of Attorney",
      "Affidavits",
    ],
  },
  spain: {
    id: "spain",
    name: "Spain",
    flag: "🇪🇸",
    tagline: "Property · Estate · Professional Matters",
    seoFact:
      "Spain is a Contracting Party to the Hague Apostille Convention, effective September 25, 1978. State, federal, and privately executed U.S. documents follow different competent-authority paths, so the document origin is confirmed before release.",
    hagueSince: "1978",
    processingDays: "Authority-dependent",
    jurisdiction: "Civil Law · Registral",
    complianceBadges: [
      "Hague Apostille",
      "Authority Review",
      "Professional Intake",
    ],
    documentTypes: [
      "Powers of Attorney",
      "Vital Records",
      "Property Documents",
      "Corporate Records",
    ],
  },
  brazil: {
    id: "brazil",
    name: "Brazil",
    flag: "🇧🇷",
    tagline: "Business · Property · Family Matters",
    seoFact:
      "Brazil is a Contracting Party to the Hague Apostille Convention, effective August 14, 2016. The correct U.S. apostille authority depends on who issued or notarized the document; receiving-authority and translation requirements are reviewed separately.",
    hagueSince: "2016",
    processingDays: "Authority-dependent",
    jurisdiction: "Civil Law · Federal",
    complianceBadges: [
      "Hague Apostille",
      "Authority Review",
      "Receiving-Authority Check",
    ],
    documentTypes: [
      "Property Records",
      "Corporate Filings",
      "Powers of Attorney",
      "Vital Records",
    ],
  },
  uae: {
    id: "uae",
    name: "UAE",
    flag: "🇦🇪",
    tagline: "Authentication & Legalization Review",
    seoFact:
      "The United Arab Emirates is not listed as a Contracting Party on the current HCCH Apostille Convention status table. U.S. document matters require authentication/legalization pathway review against the document type and UAE receiving authority before execution or release.",
    hagueSince: "Non-Hague",
    processingDays: "Route-dependent",
    jurisdiction: "Dual System · Federal/Emirate",
    complianceBadges: [
      "Authentication Review",
      "Legalization Review",
      "Receiving-Authority Check",
    ],
    documentTypes: [
      "Corporate Documents",
      "Personal Records",
      "Educational Records",
      "Powers of Attorney",
    ],
  },
  mexico: {
    id: "mexico",
    name: "Mexico",
    flag: "🇲🇽",
    tagline: "North American Hague Corridor",
    seoFact:
      "Mexico is a Contracting Party to the Hague Apostille Convention, effective August 14, 1995. The correct U.S. competent authority depends on whether the document is state-issued, federal, or privately executed and notarized.",
    hagueSince: "1995",
    processingDays: "Authority-dependent",
    jurisdiction: "Civil Law · Federal",
    complianceBadges: [
      "Hague Apostille",
      "Authority Review",
      "Receiving-Authority Check",
    ],
    documentTypes: [
      "Powers of Attorney",
      "Property Documents",
      "Corporate Records",
      "Vital Records",
    ],
  },
  portugal: {
    id: "portugal",
    name: "Portugal",
    flag: "🇵🇹",
    tagline: "Residency · Property · Estate Matters",
    seoFact:
      "Portugal is a Contracting Party to the Hague Apostille Convention, effective February 4, 1969. The competent U.S. authority depends on document origin and execution; Portuguese receiving-authority and translation requirements remain matter-specific.",
    hagueSince: "1969",
    processingDays: "Authority-dependent",
    jurisdiction: "Civil Law · Notarial",
    complianceBadges: [
      "Hague Apostille",
      "Authority Review",
      "Receiving-Authority Check",
    ],
    documentTypes: [
      "Powers of Attorney",
      "Property Documents",
      "Vital Records",
      "Estate Records",
    ],
  },
  greece: {
    id: "greece",
    name: "Greece",
    flag: "🇬🇷",
    tagline: "Citizenship · Succession · Property Matters",
    seoFact:
      "Greece is a Contracting Party to the Hague Apostille Convention, effective May 18, 1985. The correct U.S. authority path depends on the document origin; notarization, translation, and witness requirements are never assumed across all matters.",
    hagueSince: "1985",
    processingDays: "Authority-dependent",
    jurisdiction: "Civil Law · Hellenic Authorities",
    complianceBadges: [
      "Hague Apostille",
      "Authority Review",
      "Receiving-Authority Check",
    ],
    documentTypes: [
      "Citizenship Records",
      "Powers of Attorney",
      "Estate Records",
      "Property Documents",
    ],
  },
};

interface Props {
  countryId: string | null;
  onClose: () => void;
}

export function CountryComplianceCard({ countryId, onClose }: Props) {
  const data = countryId ? COUNTRY_COMPLIANCE_DATA[countryId] : null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {data && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key={`card-${data.id}`}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-4 top-[8%] z-[61] mx-auto max-w-lg md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
            role="dialog"
            aria-modal="true"
            aria-label={`${data.name} compliance information`}
          >
            <div className="relative rounded-2xl border border-[#C6A55A]/20 bg-[#0A0A0A]/98 shadow-[0_32px_80px_rgba(0,0,0,0.85),0_0_0_1px_rgba(198,165,90,0.06)] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/60 to-transparent" />

              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-center gap-4">
                  <span
                    className="text-4xl leading-none select-none"
                    role="img"
                    aria-label={data.name}
                  >
                    {data.flag}
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {data.name}
                    </h2>
                    <p className="text-[11px] text-[#C6A55A] tracking-[0.15em] uppercase mt-0.5">
                      {data.tagline}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mx-6 rounded-xl border border-[#C6A55A]/12 bg-[#C6A55A]/[0.04] p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-[#C6A55A] flex-shrink-0" />
                  <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#C6A55A]">
                    Authority Route Intelligence
                  </span>
                </div>
                <p className="text-sm text-[#C0C0C0] leading-relaxed">
                  {data.seoFact}
                </p>
              </div>

              <div className="mx-6 grid grid-cols-3 gap-2.5 mb-4">
                {[
                  { Icon: Shield, label: "Hague Since", value: data.hagueSince },
                  { Icon: Clock, label: "Timeline", value: data.processingDays },
                  {
                    Icon: FileCheck,
                    label: "Jurisdiction",
                    value: data.jurisdiction,
                  },
                ].map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#C6A55A] mx-auto mb-1.5" />
                    <div className="text-[9px] text-[#555] uppercase tracking-widest mb-0.5">
                      {label}
                    </div>
                    <div className="text-[11px] font-medium text-white leading-tight">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mx-6 mb-4">
                <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#666] mb-2">
                  Route Controls
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.complianceBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#C6A55A]/20 bg-[#C6A55A]/[0.06] text-[11px] text-[#C6A55A]"
                    >
                      <CheckCircle className="w-2.5 h-2.5 flex-shrink-0" />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mx-6 mb-6">
                <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#666] mb-2">
                  Common Matters
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.documentTypes.map((document) => (
                    <span
                      key={document}
                      className="px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.02] text-[11px] text-[#777]"
                    >
                      {document}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6">
                <Link
                  href={`/intake?country=${encodeURIComponent(data.name)}&source=country-card`}
                  onClick={onClose}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#C6A55A] text-[#0A0A0A] text-sm font-semibold rounded-xl transition-all duration-200 hover:bg-[#D4B76A] active:scale-[0.98]"
                >
                  Begin {data.name} Intake
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/map?country=${encodeURIComponent(data.id)}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-[#2A2A2A] text-[#777] text-sm rounded-xl transition-all duration-200 hover:border-[#C6A55A]/30 hover:text-white"
                >
                  <Globe className="w-4 h-4" />
                  Map
                </Link>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/20 to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
