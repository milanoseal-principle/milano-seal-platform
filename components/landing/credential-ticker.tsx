"use client";

import { Activity, Radio, Wifi, Cpu, TerminalSquare, Network, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: Activity,       label: "SECURE VAULT GATEWAY // ACCESS REVIEW READY" },
  { icon: Network,        label: "HAGUE CONVENTION ROUTING // DESTINATION MATRIX AVAILABLE" },
  { icon: TerminalSquare, label: "FLORIDA RON AUTHORITY // EXECUTION PATHWAY SUPPORTED" },
  { icon: ShieldCheck,    label: "APOSTILLE COORDINATION // REVIEW BEFORE RELEASE" },
  { icon: Cpu,            label: "DOCUMENT INTELLIGENCE // STRUCTURED INTAKE READY" },
  { icon: Radio,          label: "PROFESSIONAL LIAISON NETWORK // COORDINATION PATHWAYS AVAILABLE" },
  { icon: Wifi,           label: "PROTOCOL V2026 // SECURE ACCESS MODEL PREPARED" },
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
