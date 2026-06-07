"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, ArrowRight, Shield, Clock, FileCheck, Globe, CheckCircle } from "lucide-react";

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
    tagline: "Hague Gateway to the European Union",
    seoFact:
      "Italy has been a Hague Convention member since 1978. A single Florida-issued apostille grants simultaneous legal recognition across all 27 EU member states — no consular chain, no re-authentication required.",
    hagueSince: "1978",
    processingDays: "3–5",
    jurisdiction: "Civil Law · Notarial",
    complianceBadges: ["Hague Apostille", "EU Direct Recognition", "UNODC Compliant"],
    documentTypes: ["Birth & Vital Records", "Corporate Resolutions", "Powers of Attorney", "Educational Diplomas"],
  },
  spain: {
    id: "spain",
    name: "Spain",
    flag: "🇪🇸",
    tagline: "Highest Apostille Volume in the Hague Network",
    seoFact:
      "Spain processes over 2.1 million apostilles annually — more than any other Hague member. Florida-authenticated documents carry full legal weight across all 17 autonomous communities and Spanish territories simultaneously.",
    hagueSince: "1978",
    processingDays: "3–5",
    jurisdiction: "Civil Law · Registral",
    complianceBadges: ["Hague Apostille", "EU Direct Recognition", "Registro Civil Ready"],
    documentTypes: ["Birth Certificates", "Marriage Records", "Business Contracts", "Educational Credentials"],
  },
  brazil: {
    id: "brazil",
    name: "Brazil",
    flag: "🇧🇷",
    tagline: "Latin America's Federal Apostille Gateway",
    seoFact:
      "Brazil joined the Hague Convention in August 2016 — a landmark accession. Documents previously requiring full consular legalization now move directly into Brazil's CNJ federal registry via Florida apostille, cutting processing from weeks to days.",
    hagueSince: "2016",
    processingDays: "5–7",
    jurisdiction: "Civil Law · Federal (CNJ)",
    complianceBadges: ["Hague Apostille", "CNJ Direct Registry", "Cartório Compatible"],
    documentTypes: ["Property Deeds", "CPF Registration", "Corporate Filings", "Inheritance Records"],
  },
  uae: {
    id: "uae",
    name: "UAE",
    flag: "🇦🇪",
    tagline: "DIFC & ADGM Financial Zone Authority",
    seoFact:
      "The UAE acceded to the Hague Convention in January 2021. Dubai's DIFC and Abu Dhabi's ADGM — two of the world's leading financial free zones — require apostille-verified documents for all entity formations, fund registrations, and fiduciary appointments.",
    hagueSince: "2021",
    processingDays: "5–7",
    jurisdiction: "Dual System · Common + Civil",
    complianceBadges: ["Hague Apostille (2021)", "DIFC Recognized", "ADGM Compliant"],
    documentTypes: ["Entity Formation Docs", "Bank Mandate Letters", "Real Estate Deeds", "Employment Contracts"],
  },
  mexico: {
    id: "mexico",
    name: "Mexico",
    flag: "🇲🇽",
    tagline: "North America's Civil Law Bridge",
    seoFact:
      "Mexico has been a Hague Convention member since 1995. As a federalized civil law nation with 32 states, apostilled documents must align with Mexico's Notario Público system — Florida's RON certification is formally recognized as its equivalent for cross-border execution.",
    hagueSince: "1995",
    processingDays: "3–5",
    jurisdiction: "Civil Law · Notario Público",
    complianceBadges: ["Hague Apostille", "Notario Compatible", "SRE Registry Ready"],
    documentTypes: ["Property Escrituras", "Business Powers of Attorney", "Corporate Resolutions", "Vital Records"],
  },
  portugal: {
    id: "portugal",
    name: "Portugal",
    flag: "🇵🇹",
    tagline: "Atlantic Gateway to the Portuguese-Speaking World",
    seoFact:
      "Portugal has been a Hague Convention member since 1968 and serves as the apostille bridge for Brazil, Angola, Mozambique, and Cape Verde. A Florida apostille authenticated through Portugal can cascade into the entire Lusophone legal sphere via bilateral recognition frameworks.",
    hagueSince: "1968",
    processingDays: "3–5",
    jurisdiction: "Civil Law · Notarial (IRN)",
    complianceBadges: ["Hague Apostille", "Lusophone Bridge", "EU Direct Recognition", "IRN Registry Ready"],
    documentTypes: ["Residence Permits", "Powers of Attorney", "Property Deeds", "Vital Records"],
  },
  greece: {
    id: "greece",
    name: "Greece",
    flag: "🇬🇷",
    tagline: "Hellenic Republic — Civil & Maritime Jurisdiction",
    seoFact:
      "Greece has been a Hague Convention member since 1985 and is a primary apostille destination for Greek diaspora documentation — citizenship restoration, property inheritance, and maritime corporate filings. The Hellenic Ministry of Interior requires Florida-notarized documents to carry a state-issued apostille before registry acceptance.",
    hagueSince: "1985",
    processingDays: "5–7",
    jurisdiction: "Civil Law · Hellenic Ministry",
    complianceBadges: ["Hague Apostille", "Diaspora Registry Compliant", "EU Direct Recognition", "Maritime Authority Ready"],
    documentTypes: ["Greek Citizenship Restoration", "Inheritance & Estate Docs", "Maritime Corporate Filings", "Property Deeds"],
  },
};

interface Props {
  countryId: string | null;
  onClose: () => void;
}

export function CountryComplianceCard({ countryId, onClose }: Props) {
  const data = countryId ? COUNTRY_COMPLIANCE_DATA[countryId] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {data && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
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
              {/* Gold top line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/60 to-transparent" />

              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl leading-none select-none" role="img" aria-label={data.name}>
                    {data.flag}
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{data.name}</h2>
                    <p className="text-[11px] text-[#C6A55A] tracking-[0.15em] uppercase mt-0.5">{data.tagline}</p>
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

              {/* Compliance fact */}
              <div className="mx-6 rounded-xl border border-[#C6A55A]/12 bg-[#C6A55A]/[0.04] p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-[#C6A55A] flex-shrink-0" />
                  <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#C6A55A]">
                    Hague Route Intelligence
                  </span>
                </div>
                <p className="text-sm text-[#C0C0C0] leading-relaxed">{data.seoFact}</p>
              </div>

              {/* Stats row */}
              <div className="mx-6 grid grid-cols-3 gap-2.5 mb-4">
                {[
                  { Icon: Shield,    label: "Hague Since",  value: data.hagueSince },
                  { Icon: Clock,     label: "Processing",   value: `${data.processingDays} days` },
                  { Icon: FileCheck, label: "Jurisdiction", value: data.jurisdiction },
                ].map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center"
                  >
                    <Icon className="w-3.5 h-3.5 text-[#C6A55A] mx-auto mb-1.5" />
                    <div className="text-[9px] text-[#555] uppercase tracking-widest mb-0.5">{label}</div>
                    <div className="text-[11px] font-medium text-white leading-tight">{value}</div>
                  </div>
                ))}
              </div>

              {/* Compliance badges */}
              <div className="mx-6 mb-4">
                <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#666] mb-2">
                  Compliance Clearances
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

              {/* Document types */}
              <div className="mx-6 mb-6">
                <div className="text-[9px] font-semibold tracking-[0.08em] uppercase text-[#666] mb-2">
                  Documents Handled
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.documentTypes.map((doc) => (
                    <span
                      key={doc}
                      className="px-2.5 py-1 rounded-full border border-white/[0.07] bg-white/[0.02] text-[11px] text-[#777]"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-3 px-6 pb-6">
                <Link
                  href={`/intake?country=${encodeURIComponent(data.name)}`}
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

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/20 to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
