"use client";

import { Shield, Globe, Video, FileCheck, Users, Layers, Navigation } from "lucide-react";

const ITEMS = [
  { icon: Shield,     label: "FLORIDA NOTARY #668288 // LICENSED & COMMISSIONED" },
  { icon: Globe,      label: "HAGUE CONVENTION ROUTING // INTERNATIONAL STANDARDS" },
  { icon: Video,      label: "REMOTE ONLINE NOTARIZATION // RON CERTIFIED NETWORK" },
  { icon: FileCheck,  label: "FL DEPT OF STATE PATHWAY // APOSTILLE COORDINATION" },
  { icon: Users,      label: "USCIS DOCUMENT SUPPORT // CLEARANCE VALIDATION" },
  { icon: Layers,     label: "MATTER REVIEW SYSTEM // MULTI-GATE EXECUTION" },
  { icon: Navigation, label: "TALLAHASSEE FIELD DISPATCH // PHYSICAL COURIER · FL DEPT OF STATE" },
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
