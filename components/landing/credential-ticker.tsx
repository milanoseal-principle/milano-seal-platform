"use client";

import { Shield, Globe, Video, FileCheck, Users, Layers, Navigation } from "lucide-react";

const ITEMS = [
  { icon: Shield,     label: "FLORIDA NOTARY #668288 // COMMISSION ACTIVE" },
  { icon: Globe,      label: "HAGUE CONVENTION ROUTING // 21+ JURISDICTIONS INDEXED" },
  { icon: Video,      label: "REMOTE ONLINE NOTARIZATION // SECURE SESSION AVAILABLE" },
  { icon: FileCheck,  label: "FLORIDA DEPT OF STATE // APOSTILLE ROUTE ACTIVE" },
  { icon: Users,      label: "USCIS DOCUMENT SUPPORT // PACKAGE REVIEW AVAILABLE" },
  { icon: Layers,     label: "MATTER REVIEW // 1-BUSINESS-DAY RESPONSE WINDOW" },
  { icon: Navigation, label: "TALLAHASSEE DISPATCH // FIELD MOBILIZATION AVAILABLE" },
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
