"use client";

import { Shield, Globe, FileCheck, Layers, Navigation, MapPin, Compass } from "lucide-react";

const ITEMS = [
  { icon: Globe,      label: "FLORIDA → ITALY // APOSTILLE VALIDATION ACTIVE" },
  { icon: Navigation, label: "FLORIDA → SPAIN // HAGUE ROUTE REVIEW" },
  { icon: Compass,    label: "FLORIDA → UAE // CONSULAR AUTHENTICATION WORKFLOW" },
  { icon: MapPin,     label: "FLORIDA → BRAZIL // DOCUMENT AUTHENTICATION SEQUENCE" },
  { icon: Globe,      label: "FLORIDA → GREECE // STRUCTURED RELEASE PATH" },
  { icon: Shield,     label: "PAYMENT-GATED EXECUTION // CHAIN-OF-CUSTODY VISIBILITY" },
  { icon: FileCheck,  label: "DESTINATION VALIDATION ACTIVE // HAGUE ROUTE REVIEW" },
  { icon: Layers,     label: "STRUCTURED RELEASE WORKFLOW // CROSS-BORDER COORDINATION" },
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
