"use client";

const RAIL_A = [
  { label: "GLOBAL DOCUMENT INTELLIGENCE", tone: "gold" },
  { label: "HAGUE ROUTE REVIEW",            tone: "gold" },
  { label: "PAYMENT-GATED EXECUTION",       tone: "emerald" },
  { label: "CHAIN-OF-CUSTODY VISIBILITY",   tone: "emerald" },
  { label: "WISE PAYMENT REFERENCE",        tone: "gold" },
  { label: "COURIER RELEASE TRACKING",      tone: "gold" },
  { label: "PRE-FLIGHT REVIEW",             tone: "gold" },
  { label: "DOCUMENT VAULT",                tone: "emerald" },
  { label: "PAID & RELEASED",               tone: "emerald" },
  { label: "APOSTILLE COORDINATION",        tone: "gold" },
  { label: "INTERNATIONAL COORDINATION",    tone: "gold" },
  { label: "COORDINATOR VISIBILITY",        tone: "gold" },
];

const RAIL_B: { route: string; workflow: string }[] = [
  { route: "FLORIDA → ITALY",    workflow: "Hague Convention Validation Route" },
  { route: "FLORIDA → SPAIN",    workflow: "Apostille Review Pathway" },
  { route: "FLORIDA → UAE",      workflow: "Consular Authentication Workflow" },
  { route: "FLORIDA → BRAZIL",   workflow: "International Release Corridor" },
  { route: "FLORIDA → MEXICO",   workflow: "Cross-Border Legalization Path" },
  { route: "FLORIDA → PORTUGAL", workflow: "Hague Apostille Review Path" },
  { route: "FLORIDA → GREECE",   workflow: "Hague Convention Document Route" },
import { Activity, Radio, Wifi, Cpu, TerminalSquare, Network, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: Activity,       label: "SECURE VAULT GATEWAY: ACTIVE // LATENCY 14MS" },
  { icon: Network,        label: "HAGUE CONVENTION JURISDICTIONS: 125+ MEMBERS VERIFIED" },
  { icon: TerminalSquare, label: "FLORIDA DOS RON SEALS: EMITTING // TALLAHASSEE CORE ONLINE" },
  { icon: ShieldCheck,    label: "APOSTILLE ROUTING ENGINE: LIVE // EXECUTION QUEUE CLEAR" },
  { icon: Cpu,            label: "USCIS-READY DOCUMENT MATRIX: FULL COMPLIANCE CLEARANCE" },
  { icon: Radio,          label: "LEGAL-MEDICAL LIAISON TERMINALS: CONNECTED // TRIAGE STABLE" },
  { icon: Wifi,           label: "PROTOCOL V2026: ACTIVE // ALLIANCE AGENT TOKENS PARSING" },
];

export function CredentialTicker() {
  return (
    <div
      className="border-b border-[#D4AF37]/10 bg-black/60 overflow-hidden relative"
      aria-hidden="true"
    >
      {/* Rail A — operational signals, scrolls left */}
      <div className="flex ticker-anim whitespace-nowrap py-1.5 relative">
        {[...RAIL_A, ...RAIL_A].map((item, i) => (
          <span
            key={`a-${i}`}
            className="text-[9px] font-mono tracking-[0.3em] mx-8 flex items-center gap-2.5"
            style={{ color: "rgba(220, 195, 120, 0.92)" }}
          >
            <span
              className="w-1 h-1 rounded-full flex-shrink-0"
              style={{
                background:
                  item.tone === "emerald"
                    ? "rgba(52,211,153,0.85)"
                    : "rgba(212,175,55,0.85)",
                boxShadow:
                  item.tone === "emerald"
                    ? "0 0 6px rgba(16,185,129,0.5)"
                    : "0 0 5px rgba(212,175,55,0.4)",
              }}
            />
            {item.label}
          </span>
        ))}
      </div>

      {/* Hairline separator with traveling gold sweep */}
      <div className="relative h-px bg-[#D4AF37]/10 overflow-hidden">
        <div className="absolute inset-y-0 w-[20%] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent rail-sweep" />
      </div>

      {/* Rail B — corridor map, scrolls right */}
      <div className="flex ticker-anim-reverse whitespace-nowrap py-1.5 relative">
        {[...RAIL_B, ...RAIL_B].map((item, i) => (
          <span
            key={`b-${i}`}
            className="mx-8 flex items-center gap-3 flex-shrink-0"
          >
            <span
              className="w-2 h-px flex-shrink-0"
              style={{ background: "rgba(212,175,55,0.5)" }}
            />
            <span className="flex flex-col leading-tight">
              <span
                className="text-[9px] font-mono tracking-[0.28em]"
                style={{ color: "rgba(210, 185, 110, 0.90)" }}
              >
                {item.route}
              </span>
              <span
                className="text-[7px] font-mono tracking-[0.18em]"
                style={{ color: "rgba(180, 155, 90, 0.50)" }}
              >
                {item.workflow}
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
