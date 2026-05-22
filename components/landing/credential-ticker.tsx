"use client";

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
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="ticker-wrap ticker-delayed" aria-hidden="true">
      <div className="ticker-track">
        {doubled.map(({ icon: Icon, label }, i) => (
          <span key={i} className="ticker-item">
            <Icon className="ticker-item__icon w-3.5 h-3.5" aria-hidden="true" />
            {label}
            <span className="ticker-item__dot" />
          </span>
        ))}
      </div>
    </div>
  );
}
