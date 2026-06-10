"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerItem } from "@/lib/animations";

type SpecialistStatus = "Needed" | "Partner Identified" | "Active Partner";

interface SpecialistSlot {
  type: string;
  status: SpecialistStatus;
}

interface CountrySpec {
  name: string;
  flag: string;
  specialists: SpecialistSlot[];
}

const STATUS_STYLES: Record<SpecialistStatus, { bg: string; color: string; border: string }> = {
  "Needed": {
    bg: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.3)",
    border: "rgba(255,255,255,0.08)",
  },
  "Partner Identified": {
    bg: "rgba(245,158,11,0.06)",
    color: "rgba(245,158,11,0.7)",
    border: "rgba(245,158,11,0.2)",
  },
  "Active Partner": {
    bg: "rgba(34,197,94,0.06)",
    color: "rgba(34,197,94,0.7)",
    border: "rgba(34,197,94,0.2)",
  },
};

const SPECIALIST_TYPES = ["Translator", "Genealogist", "Attorney", "Courier", "Country Expert"];

const COUNTRIES: CountrySpec[] = [
  { name: "Italy", flag: "🇮🇹", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "Portugal", flag: "🇵🇹", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "Mexico", flag: "🇲🇽", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "Spain", flag: "🇪🇸", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "Germany", flag: "🇩🇪", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "France", flag: "🇫🇷", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "Greece", flag: "🇬🇷", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "Brazil", flag: "🇧🇷", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "China", flag: "🇨🇳", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
  { name: "Vietnam", flag: "🇻🇳", specialists: SPECIALIST_TYPES.map((t) => ({ type: t, status: "Needed" })) },
];

function StatusChip({ status }: { status: SpecialistStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className="text-[8px] font-mono uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-sm"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}

function CountryCard({ country, index }: { country: CountrySpec; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-sm"
      style={{
        background: "rgba(8,5,1,0.96)",
        border: "1px solid rgba(212,175,55,0.1)",
      }}
    >
      <div
        className="px-4 py-3 border-b flex items-center justify-between gap-3"
        style={{ borderColor: "rgba(212,175,55,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{country.flag}</span>
          <span
            className="text-sm font-light"
            style={{
              color: "#d4af37",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            {country.name}
          </span>
        </div>
        <Link
          href="/dashboard/relationships"
          className="text-[8px] font-mono uppercase tracking-[0.12em] px-2 py-0.5 rounded-sm transition-colors"
          style={{
            background: "rgba(212,175,55,0.06)",
            color: "rgba(212,175,55,0.5)",
            border: "1px solid rgba(212,175,55,0.15)",
          }}
        >
          Add Partner
        </Link>
      </div>
      <div className="px-4 py-3 space-y-2">
        {country.specialists.map((spec) => (
          <div key={spec.type} className="flex items-center justify-between gap-3">
            <span
              className="text-[10px] font-mono"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              {spec.type}
            </span>
            <StatusChip status={spec.status} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function CountrySpecialistNetwork() {
  return (
    <div
      className="rounded-sm"
      style={{
        background: "rgba(8,5,1,0.96)",
        border: "1px solid rgba(212,175,55,0.1)",
      }}
    >
      <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
        <div
          className="text-[9px] font-mono uppercase tracking-[0.25em] mb-1"
          style={{ color: "rgba(212,175,55,0.5)" }}
        >
          Alliance Operations Center 2.0
        </div>
        <h2
          className="text-sm font-light"
          style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}
        >
          Country Specialist Network
        </h2>
        <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          Per-country specialist directory. Partner data accumulates as vetted relationships are established.
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {COUNTRIES.map((country, i) => (
            <CountryCard key={country.name} country={country} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
