"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Vertical {
  id: string;
  name: string;
  category:
    | "Estate & Trust"
    | "Citizenship & Immigration"
    | "Luxury & Asset"
    | "Corporate & Finance"
    | "Healthcare & Life Sciences"
    | "Education & Credentials"
    | "Family & Personal";
  priority: "GOLD MINE" | "HIGH" | "STRONG" | "DEVELOPING";
  documents: string[];
  referral_sources: string[];
  avg_deal_value_range: string;
  deal_frequency: "One-time" | "Recurring" | "High-volume recurring";
  notes: string;
}

// ── Vertical Registry ─────────────────────────────────────────────────────────

export const VERTICALS: Vertical[] = [
  // ── Estate & Trust — GOLD MINE ──────────────────────────────────────────────
  {
    id: "family-offices",
    name: "Family Offices",
    category: "Estate & Trust",
    priority: "GOLD MINE",
    documents: ["POA", "Trust Documents", "Death Certificates", "Inheritance Affidavits"],
    referral_sources: ["Single Family Office Directors", "Multi-Family Office Principals", "Private Wealth Advisors"],
    avg_deal_value_range: "$1,200–$8,000",
    deal_frequency: "Recurring",
    notes: "Multi-generational wealth creates continuous international document events across jurisdictions.",
  },
  {
    id: "trust-estate-attorneys",
    name: "Trust & Estate Attorneys",
    category: "Estate & Trust",
    priority: "GOLD MINE",
    documents: ["Death Certificates", "Birth Certificates", "Marriage Certificates", "Trust Documents", "POA"],
    referral_sources: ["Estate Planning Attorneys", "Probate Bar Associations", "Elder Law Firms"],
    avg_deal_value_range: "$800–$5,000",
    deal_frequency: "High-volume recurring",
    notes: "Primary referral engine. Every international estate matter requires apostilled documents.",
  },
  {
    id: "probate-attorneys",
    name: "Probate Attorneys",
    category: "Estate & Trust",
    priority: "GOLD MINE",
    documents: ["Death Certificates", "Inheritance Affidavits", "Court Documents"],
    referral_sources: ["Probate Attorneys", "Surrogate Court Networks", "Estate Litigation Firms"],
    avg_deal_value_range: "$600–$3,500",
    deal_frequency: "Recurring",
    notes: "Every international heir requires authenticated death and inheritance documents.",
  },
  {
    id: "private-banks",
    name: "Private Banks",
    category: "Estate & Trust",
    priority: "GOLD MINE",
    documents: ["POA", "Trust Documents", "Identity Packages"],
    referral_sources: ["Private Banking Relationship Managers", "Wealth Management Desks", "International Banking Officers"],
    avg_deal_value_range: "$1,500–$10,000",
    deal_frequency: "Recurring",
    notes: "UHNWIs opening international accounts and managing cross-border estate transfers.",
  },
  {
    id: "wealth-managers",
    name: "Wealth Managers",
    category: "Estate & Trust",
    priority: "GOLD MINE",
    documents: ["Corporate Documents", "POA", "Identity Packages"],
    referral_sources: ["Registered Investment Advisors", "Multi-Family Offices", "Independent Wealth Managers"],
    avg_deal_value_range: "$900–$4,500",
    deal_frequency: "Recurring",
    notes: "Asset restructuring, offshore account management, and succession planning create recurring events.",
  },
  {
    id: "trust-companies",
    name: "Trust Companies",
    category: "Estate & Trust",
    priority: "GOLD MINE",
    documents: ["POA", "Trust Documents", "Corporate Authorization"],
    referral_sources: ["Corporate Trust Officers", "Directed Trust Companies", "Institutional Trustees"],
    avg_deal_value_range: "$1,000–$6,000",
    deal_frequency: "Recurring",
    notes: "Institutional trustees managing international trust administration require ongoing document execution.",
  },
  // ── Citizenship & Immigration — GOLD MINE ───────────────────────────────────
  {
    id: "citizenship-investment-firms",
    name: "Citizenship Investment Firms",
    category: "Citizenship & Immigration",
    priority: "GOLD MINE",
    documents: ["Birth Certificates", "Marriage Certificates", "Death Certificates", "FBI Reports", "POA", "Affidavits"],
    referral_sources: ["CBI Program Agents", "Second Passport Firms", "Golden Visa Advisors"],
    avg_deal_value_range: "$2,000–$12,000",
    deal_frequency: "High-volume recurring",
    notes: "Every CBI application requires a full authenticated document package — highest volume potential.",
  },
  {
    id: "immigration-attorneys",
    name: "Immigration Attorneys",
    category: "Citizenship & Immigration",
    priority: "GOLD MINE",
    documents: ["Birth Certificates", "Marriage Certificates", "FBI Reports", "Affidavits"],
    referral_sources: ["Immigration Law Firms", "AILA Member Attorneys", "Consular Practice Groups"],
    avg_deal_value_range: "$500–$4,000",
    deal_frequency: "High-volume recurring",
    notes: "Visa applications, green card petitions, and naturalization require authenticated foreign documents.",
  },
  {
    id: "surrogacy-fertility-networks",
    name: "Surrogacy & Fertility Networks",
    category: "Citizenship & Immigration",
    priority: "GOLD MINE",
    documents: ["Birth Certificates", "Court Orders", "Medical Consents"],
    referral_sources: ["Surrogacy Agencies", "Reproductive Law Attorneys", "International Fertility Clinics"],
    avg_deal_value_range: "$800–$3,500",
    deal_frequency: "Recurring",
    notes: "Cross-border surrogacy creates complex citizenship documentation events requiring apostille.",
  },
  {
    id: "international-adoption-attorneys",
    name: "International Adoption Attorneys",
    category: "Citizenship & Immigration",
    priority: "GOLD MINE",
    documents: ["Birth Records", "Court Orders", "Affidavits"],
    referral_sources: ["Adoption Law Firms", "Hague Convention Adoption Agencies", "USCIS Accredited Agencies"],
    avg_deal_value_range: "$1,000–$5,000",
    deal_frequency: "High-volume recurring",
    notes: "Every international adoption requires authenticated foreign birth and court records.",
  },
  {
    id: "relocation-global-mobility",
    name: "Relocation & Global Mobility Firms",
    category: "Citizenship & Immigration",
    priority: "GOLD MINE",
    documents: ["Background Checks", "Diplomas", "POA"],
    referral_sources: ["Global Mobility Managers", "Corporate Relocation Firms", "International HR Consultants"],
    avg_deal_value_range: "$500–$2,500",
    deal_frequency: "Recurring",
    notes: "Executive relocations and international employee transfers require credential authentication.",
  },
  // ── Luxury & Asset — HIGH ────────────────────────────────────────────────────
  {
    id: "yacht-brokers",
    name: "Yacht Brokers",
    category: "Luxury & Asset",
    priority: "HIGH",
    documents: ["POA", "Corporate Documents", "Ownership Documents"],
    referral_sources: ["FYBA Member Brokers", "Superyacht Industry Contacts", "Maritime Attorneys"],
    avg_deal_value_range: "$800–$4,000",
    deal_frequency: "Recurring",
    notes: "International vessel transfers require authenticated corporate and ownership documentation.",
  },
  {
    id: "aircraft-brokers",
    name: "Aircraft Brokers",
    category: "Luxury & Asset",
    priority: "HIGH",
    documents: ["POA", "Corporate Documents", "Ownership Documents"],
    referral_sources: ["NARA Member Brokers", "Aviation Attorneys", "Private Aviation Networks"],
    avg_deal_value_range: "$1,000–$5,000",
    deal_frequency: "Recurring",
    notes: "Cross-border aircraft acquisitions require FAA and foreign authority authentication.",
  },
  {
    id: "luxury-real-estate-brokers",
    name: "Luxury Real Estate Brokers",
    category: "Luxury & Asset",
    priority: "HIGH",
    documents: ["POA", "Closing Documents", "Corporate Authorization"],
    referral_sources: ["Christie's International RE", "Sotheby's Realty Contacts", "International RE Attorneys"],
    avg_deal_value_range: "$600–$3,500",
    deal_frequency: "Recurring",
    notes: "Foreign buyers purchasing US real estate require authenticated identity and authorization documents.",
  },
  {
    id: "equine-bloodstock-agents",
    name: "Equine & Bloodstock Agents",
    category: "Luxury & Asset",
    priority: "HIGH",
    documents: ["Ownership Documents", "Affidavits", "Corporate Documents"],
    referral_sources: ["Thoroughbred Sales Agents", "Bloodstock Advisors", "Equine Attorneys"],
    avg_deal_value_range: "$500–$2,500",
    deal_frequency: "Recurring",
    notes: "International horse sales and registration transfers require authenticated ownership documents.",
  },
  {
    id: "art-advisors-auction-houses",
    name: "Art Advisors & Auction Houses",
    category: "Luxury & Asset",
    priority: "HIGH",
    documents: ["Corporate Documents", "Provenance Documents", "POA"],
    referral_sources: ["Art Advisory Firms", "Christie's / Sotheby's / Phillips", "Art Law Attorneys"],
    avg_deal_value_range: "$700–$4,000",
    deal_frequency: "Recurring",
    notes: "Cross-border art transactions and provenance authentication require document legalization.",
  },
  {
    id: "diamond-gem-dealers",
    name: "Diamond & Gem Dealers",
    category: "Luxury & Asset",
    priority: "HIGH",
    documents: ["Corporate Documents", "Certificates", "POA"],
    referral_sources: ["Rapaport Network Contacts", "GIA-Affiliated Dealers", "Diamond District Trade Contacts"],
    avg_deal_value_range: "$500–$3,000",
    deal_frequency: "Recurring",
    notes: "International gem trading and Kimberley Process compliance create authentication demand.",
  },
  // ── Corporate & Finance — HIGH ───────────────────────────────────────────────
  {
    id: "vc-pe-firms",
    name: "VC & PE Firms",
    category: "Corporate & Finance",
    priority: "HIGH",
    documents: ["Board Resolutions", "Corporate Authorization", "POA", "Fund Documents"],
    referral_sources: ["Fund Counsel", "General Partners", "Fund Administrators"],
    avg_deal_value_range: "$1,000–$6,000",
    deal_frequency: "High-volume recurring",
    notes: "Cross-border investments, fund formation, and portfolio company transactions require ongoing authentication.",
  },
  {
    id: "ma-attorneys",
    name: "M&A Attorneys",
    category: "Corporate & Finance",
    priority: "HIGH",
    documents: ["Board Resolutions", "Corporate Authorization", "POA", "Affidavits"],
    referral_sources: ["Corporate Law Firms", "M&A Practice Groups", "Deal Counsel"],
    avg_deal_value_range: "$1,500–$8,000",
    deal_frequency: "High-volume recurring",
    notes: "International acquisitions require full chain of authenticated corporate authority documents.",
  },
  {
    id: "corporate-service-providers",
    name: "Corporate Service Providers",
    category: "Corporate & Finance",
    priority: "HIGH",
    documents: ["Articles of Incorporation", "Certificates of Good Standing", "Resolutions", "Corporate Authorization"],
    referral_sources: ["Registered Agent Services", "Corporate Formation Firms", "Compliance Services"],
    avg_deal_value_range: "$300–$2,000",
    deal_frequency: "High-volume recurring",
    notes: "Entity formation, dissolution, and good standing certification for international use.",
  },
  {
    id: "international-tax-firms",
    name: "International Tax Firms",
    category: "Corporate & Finance",
    priority: "HIGH",
    documents: ["Corporate Documents", "POA", "Affidavits"],
    referral_sources: ["Big 4 International Tax Desks", "Boutique International Tax Firms", "FATCA Compliance Advisors"],
    avg_deal_value_range: "$800–$4,000",
    deal_frequency: "Recurring",
    notes: "FBAR, FATCA, and foreign account reporting require authenticated corporate and identity documents.",
  },
  {
    id: "offshore-structuring-firms",
    name: "Offshore Structuring Firms (Crypto & Traditional)",
    category: "Corporate & Finance",
    priority: "HIGH",
    documents: ["POA", "Entity Documents", "Identity Packages"],
    referral_sources: ["Offshore Law Firms", "Digital Asset Attorneys", "Crypto Compliance Consultants"],
    avg_deal_value_range: "$1,000–$6,000",
    deal_frequency: "Recurring",
    notes: "DAO structures, offshore trusts, and digital asset entities require international document authentication.",
  },
  {
    id: "international-trade-firms",
    name: "International Trade Firms",
    category: "Corporate & Finance",
    priority: "HIGH",
    documents: ["Certificates of Origin", "Corporate Documents", "Affidavits"],
    referral_sources: ["Trade Finance Banks", "Export Management Companies", "Customs Brokers"],
    avg_deal_value_range: "$400–$2,500",
    deal_frequency: "Recurring",
    notes: "Import/export documentation and certificates of origin require apostille for foreign customs authorities.",
  },
  // ── Healthcare & Life Sciences — HIGH ───────────────────────────────────────
  {
    id: "healthcare-credentialing",
    name: "Healthcare Credentialing Firms",
    category: "Healthcare & Life Sciences",
    priority: "HIGH",
    documents: ["Diplomas", "Medical Licenses", "FBI Reports", "Transcripts"],
    referral_sources: ["Hospital Credentialing Departments", "MSO Credentialing Firms", "International Medical Licensing Consultants"],
    avg_deal_value_range: "$500–$3,000",
    deal_frequency: "High-volume recurring",
    notes: "Foreign medical graduates seeking US licensure require authenticated credential packages.",
  },
  {
    id: "executive-recruiting-firms",
    name: "Executive Recruiting Firms",
    category: "Healthcare & Life Sciences",
    priority: "HIGH",
    documents: ["Background Checks", "Diplomas", "Employment Verification"],
    referral_sources: ["C-Suite Executive Recruiters", "International Headhunters", "Healthcare Staffing Firms"],
    avg_deal_value_range: "$400–$2,000",
    deal_frequency: "High-volume recurring",
    notes: "International executive placements require authenticated background and credential packages.",
  },
  {
    id: "stem-cell-life-sciences",
    name: "Stem Cell & Life Sciences Firms",
    category: "Healthcare & Life Sciences",
    priority: "HIGH",
    documents: ["Lab Certifications", "Corporate Documents", "FDA Documents", "POA"],
    referral_sources: ["Biotech General Counsel", "CRO Legal Departments", "Life Sciences Compliance Officers"],
    avg_deal_value_range: "$1,000–$5,000",
    deal_frequency: "Recurring",
    notes: "International clinical trials and regulatory submissions require authenticated institutional documents.",
  },
  {
    id: "medical-tourism",
    name: "Medical Tourism Coordinators",
    category: "Healthcare & Life Sciences",
    priority: "HIGH",
    documents: ["Medical POA", "Consent Forms", "Identity Documents"],
    referral_sources: ["Medical Tourism Agencies", "International Hospital Liaisons", "Health Travel Facilitators"],
    avg_deal_value_range: "$300–$1,500",
    deal_frequency: "Recurring",
    notes: "Patients seeking treatment abroad require authenticated medical authorization documents.",
  },
  {
    id: "international-staffing",
    name: "International Staffing Firms",
    category: "Healthcare & Life Sciences",
    priority: "HIGH",
    documents: ["Background Checks", "Credentials", "Licenses"],
    referral_sources: ["Global HR Staffing Firms", "International PEO Providers", "Nursing & Allied Health Staffing Agencies"],
    avg_deal_value_range: "$350–$1,800",
    deal_frequency: "High-volume recurring",
    notes: "International workforce deployment requires mass credential authentication across jurisdictions.",
  },
  // ── Education & Credentials — STRONG ────────────────────────────────────────
  {
    id: "international-universities",
    name: "International Universities & Schools",
    category: "Education & Credentials",
    priority: "STRONG",
    documents: ["Diplomas", "Transcripts", "Background Checks"],
    referral_sources: ["International Student Offices", "University Registrars", "Global Education Partnerships"],
    avg_deal_value_range: "$200–$1,200",
    deal_frequency: "Recurring",
    notes: "International students and faculty require authenticated academic credentials for foreign institutions.",
  },
  {
    id: "education-consultants",
    name: "Education Consultants & Admissions Firms",
    category: "Education & Credentials",
    priority: "STRONG",
    documents: ["Diplomas", "Transcripts", "Enrollment Documents"],
    referral_sources: ["College Admissions Consultants", "International Education Advisors", "Study Abroad Programs"],
    avg_deal_value_range: "$150–$900",
    deal_frequency: "Recurring",
    notes: "Students applying to foreign universities require apostilled academic credentials.",
  },
  {
    id: "professional-licensing-migration",
    name: "Professional Licensing Migration",
    category: "Education & Credentials",
    priority: "STRONG",
    documents: ["Professional Licenses", "Degrees", "FBI Reports"],
    referral_sources: ["Foreign Credential Evaluation Services", "Licensing Board Consultants", "Professional Association Migration Programs"],
    avg_deal_value_range: "$400–$2,500",
    deal_frequency: "Recurring",
    notes: "Doctors, engineers, pilots, and lawyers relocating internationally require full authenticated credential packages.",
  },
  // ── Family & Personal — STRONG ───────────────────────────────────────────────
  {
    id: "international-divorce-firms",
    name: "International Divorce Firms",
    category: "Family & Personal",
    priority: "STRONG",
    documents: ["Marriage Certificates", "Affidavits", "Court Documents"],
    referral_sources: ["International Family Law Attorneys", "Cross-Border Divorce Mediators", "Expat Legal Services"],
    avg_deal_value_range: "$400–$2,000",
    deal_frequency: "Recurring",
    notes: "Binational couples require authenticated marriage certificates and court orders for foreign divorce proceedings.",
  },
  {
    id: "sports-agencies",
    name: "Sports Agencies (International Athletes)",
    category: "Family & Personal",
    priority: "STRONG",
    documents: ["Birth Certificates", "Background Checks", "POA"],
    referral_sources: ["FIFA Agent Networks", "International Sports Agencies", "Athletic Recruitment Firms"],
    avg_deal_value_range: "$300–$1,800",
    deal_frequency: "Recurring",
    notes: "International athlete transfers and work permit applications require authenticated personal documents.",
  },
  {
    id: "entertainment-production-touring",
    name: "Entertainment Production & Touring",
    category: "Family & Personal",
    priority: "STRONG",
    documents: ["Visas", "Affidavits", "Contracts", "Identity Documents"],
    referral_sources: ["Entertainment Attorneys", "Tour Managers", "International Booking Agencies"],
    avg_deal_value_range: "$300–$2,000",
    deal_frequency: "Recurring",
    notes: "International touring acts and film productions require authenticated employment and identity documents.",
  },
  {
    id: "religious-organizations",
    name: "Religious Organizations & Ministries",
    category: "Family & Personal",
    priority: "STRONG",
    documents: ["Ordination Records", "Marriage Records", "Affidavits"],
    referral_sources: ["Diocesan Chancelleries", "International Ministry Networks", "Religious Legal Counsel"],
    avg_deal_value_range: "$200–$1,200",
    deal_frequency: "Recurring",
    notes: "International clergy deployment, canonical marriages, and ministry registration require authenticated records.",
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

export interface PartnerData {
  activePartners: number;
  partnerRevenue: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const PRIORITY_STYLES: Record<
  Vertical["priority"],
  { badge: string; border: string }
> = {
  "GOLD MINE": {
    badge:
      "bg-[rgba(198,165,90,0.15)] text-[#C6A55A] border border-[rgba(198,165,90,0.3)]",
    border:
      "border-[rgba(198,165,90,0.25)] hover:border-[rgba(198,165,90,0.6)]",
  },
  HIGH: {
    badge:
      "bg-[rgba(74,158,107,0.15)] text-[#4a9e6b] border border-[rgba(74,158,107,0.25)]",
    border:
      "border-[rgba(74,158,107,0.2)] hover:border-[rgba(74,158,107,0.5)]",
  },
  STRONG: {
    badge:
      "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]",
    border:
      "border-[rgba(245,158,11,0.15)] hover:border-[rgba(245,158,11,0.45)]",
  },
  DEVELOPING: {
    badge:
      "bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.35)] border border-[rgba(255,255,255,0.08)]",
    border:
      "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.2)]",
  },
};

const FREQ_STYLES: Record<Vertical["deal_frequency"], string> = {
  "High-volume recurring":
    "bg-[rgba(198,165,90,0.12)] text-[#C6A55A] border border-[rgba(198,165,90,0.2)]",
  Recurring:
    "bg-[rgba(74,158,107,0.1)] text-[#4a9e6b] border border-[rgba(74,158,107,0.18)]",
  "One-time":
    "bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.3)] border border-[rgba(255,255,255,0.06)]",
};

const CATEGORIES = [
  "All",
  "Estate & Trust",
  "Citizenship & Immigration",
  "Luxury & Asset",
  "Corporate & Finance",
  "Healthcare & Life Sciences",
  "Education & Credentials",
  "Family & Personal",
] as const;

type CategoryFilter = (typeof CATEGORIES)[number];

// ── Sub-components ────────────────────────────────────────────────────────────

function VerticalCard({ v, index }: { v: Vertical; index: number }) {
  const ps = PRIORITY_STYLES[v.priority];
  const maxDocs = 4;
  const visibleDocs = v.documents.slice(0, maxDocs);
  const extraDocs = v.documents.length - maxDocs;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.28, ease: EASE, delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      className={`relative rounded-lg p-4 border bg-[rgba(8,5,1,0.97)] transition-colors duration-[180ms] cursor-default ${ps.border}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-[8px] tracking-[0.28em] uppercase text-[rgba(198,165,90,0.45)] truncate">
            {v.category}
          </span>
          <span className="text-white text-[14px] font-semibold leading-snug">
            {v.name}
          </span>
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-mono tracking-[0.12em] font-semibold ${ps.badge}`}
        >
          {v.priority}
        </span>
      </div>

      {/* Frequency */}
      <div className="mb-3">
        <span
          className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono ${FREQ_STYLES[v.deal_frequency]}`}
        >
          {v.deal_frequency}
        </span>
      </div>

      {/* Documents */}
      <div className="flex flex-wrap gap-1 mb-3">
        {visibleDocs.map((doc) => (
          <span
            key={doc}
            className="px-1.5 py-0.5 rounded text-[9px] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.06)]"
          >
            {doc}
          </span>
        ))}
        {extraDocs > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[rgba(198,165,90,0.08)] text-[rgba(198,165,90,0.5)]">
            +{extraDocs} more
          </span>
        )}
      </div>

      {/* Avg value */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] text-[#C6A55A] tracking-wide">
          {v.avg_deal_value_range}
        </span>
        <span className="text-[9px] text-[rgba(255,255,255,0.25)] font-mono uppercase tracking-widest">
          avg deal
        </span>
      </div>

      {/* Notes */}
      <p className="text-[11px] text-[rgba(255,255,255,0.35)] leading-relaxed line-clamp-2 mb-2">
        {v.notes}
      </p>

      {/* Referral sources */}
      <p className="text-[10px] italic text-[rgba(255,255,255,0.25)] truncate">
        {v.referral_sources.slice(0, 2).join(" · ")}
        {v.referral_sources.length > 2 && " · …"}
      </p>
    </motion.div>
  );
}

function GoldMineCard({ v, index }: { v: Vertical; index: number }) {
  const maxDocs = 4;
  const visibleDocs = v.documents.slice(0, maxDocs);
  const extraDocs = v.documents.length - maxDocs;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE, delay: index * 0.04 }}
      whileHover={{ y: -2 }}
      className="relative rounded-lg p-4 border border-[rgba(198,165,90,0.3)] bg-[rgba(198,165,90,0.03)] hover:border-[rgba(198,165,90,0.6)] transition-colors duration-[180ms] cursor-default"
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-[radial-gradient(circle,rgba(198,165,90,0.06)_0%,transparent_70%)] rounded-full -translate-y-4 translate-x-4 pointer-events-none" />

      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <span className="font-mono text-[8px] tracking-[0.28em] uppercase text-[rgba(198,165,90,0.5)]">
            {v.category}
          </span>
          <h4 className="text-white text-[14px] font-semibold mt-0.5 leading-snug">
            {v.name}
          </h4>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-[0.12em] bg-[rgba(198,165,90,0.18)] text-[#C6A55A] border border-[rgba(198,165,90,0.3)]">
            GOLD MINE
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-mono ${FREQ_STYLES[v.deal_frequency]}`}
          >
            {v.deal_frequency}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 my-2">
        {visibleDocs.map((doc) => (
          <span
            key={doc}
            className="px-1.5 py-0.5 rounded text-[9px] bg-[rgba(198,165,90,0.06)] text-[rgba(198,165,90,0.6)] border border-[rgba(198,165,90,0.12)]"
          >
            {doc}
          </span>
        ))}
        {extraDocs > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-[rgba(198,165,90,0.08)] text-[rgba(198,165,90,0.5)]">
            +{extraDocs} more
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[12px] text-[#C6A55A] font-semibold">
          {v.avg_deal_value_range}
        </span>
        <span className="text-[9px] text-[rgba(255,255,255,0.25)] font-mono uppercase tracking-widest">
          avg deal
        </span>
      </div>

      <p className="text-[11px] text-[rgba(255,255,255,0.4)] leading-relaxed line-clamp-1 mb-1">
        {v.notes}
      </p>
      <p className="text-[10px] italic text-[rgba(198,165,90,0.35)] truncate">
        {v.referral_sources.slice(0, 2).join(" · ")}
      </p>
    </motion.div>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-[rgba(8,5,1,0.97)] border border-[rgba(212,175,55,0.08)] rounded-lg px-4 py-3">
      <span className="font-mono text-[8px] tracking-[0.32em] uppercase text-[rgba(198,165,90,0.5)]">
        {label}
      </span>
      <span className="text-white text-xl font-semibold">{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function OpportunityEngine({ activePartners, partnerRevenue }: PartnerData) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const goldMine = VERTICALS.filter((v) => v.priority === "GOLD MINE");

  const filtered =
    activeCategory === "All"
      ? VERTICALS
      : VERTICALS.filter((v) => v.category === activeCategory);

  const fmtCurrency = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6 space-y-8">
      {/* Header */}
      <div>
        <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[rgba(198,165,90,0.5)] mb-2">
          Business Development Layer
        </p>
        <h1 className="text-white text-2xl font-bold tracking-tight mb-1">
          Global Opportunity Engine
        </h1>
        <p className="text-[rgba(255,255,255,0.4)] text-sm">
          {VERTICALS.length} verticals. Every one creates recurring document execution events.
        </p>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryChip label="Total Verticals" value={String(VERTICALS.length)} />
        <SummaryChip label="Gold Mine Verticals" value={String(goldMine.length)} />
        <SummaryChip
          label="Active Partners"
          value={activePartners > 0 ? String(activePartners) : "—"}
        />
        <SummaryChip
          label="Revenue from Partners"
          value={partnerRevenue > 0 ? fmtCurrency(partnerRevenue) : "—"}
        />
      </div>

      {/* Gold Mine section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[rgba(198,165,90,0.5)]">
            Gold Mine Verticals
          </p>
          <div className="flex-1 h-px bg-[rgba(198,165,90,0.1)]" />
          <span className="font-mono text-[9px] text-[rgba(198,165,90,0.4)]">
            Highest recurring value
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {goldMine.map((v, i) => (
            <GoldMineCard key={v.id} v={v} index={i} />
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div>
        <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[rgba(198,165,90,0.5)] mb-3">
          All Verticals by Category
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count =
              cat === "All"
                ? VERTICALS.length
                : VERTICALS.filter((v) => v.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-mono tracking-wide transition-all duration-200 border ${
                  isActive
                    ? "bg-[rgba(198,165,90,0.15)] text-[#C6A55A] border-[rgba(198,165,90,0.35)]"
                    : "bg-transparent text-[rgba(255,255,255,0.35)] border-[rgba(255,255,255,0.08)] hover:text-[rgba(255,255,255,0.6)] hover:border-[rgba(255,255,255,0.15)]"
                }`}
              >
                {cat === "Healthcare & Life Sciences" ? "Healthcare" : cat}
                <span className="ml-1.5 text-[9px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Vertical cards grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {filtered.map((v, i) => (
              <VerticalCard key={v.id} v={v} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
