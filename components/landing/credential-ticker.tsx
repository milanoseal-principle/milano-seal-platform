"use client";

import {
  Shield,
  Globe,
  Lock,
  Award,
  Scale,
  Clock,
  FileCheck,
  Star,
} from "lucide-react";

const ITEMS = [
  { icon: Shield, label: "Florida Notary #668288" },
  { icon: Globe, label: "Hague Convention — 21+ Countries" },
  { icon: Lock, label: "Payment-Gated Execution" },
  { icon: Award, label: "RON Certified" },
  { icon: Scale, label: "Apostille Authority — FL Dept of State" },
  { icon: Clock, label: "1-Business-Day Response" },
  { icon: FileCheck, label: "USCIS-Ready Document Packages" },
  { icon: Star, label: "Procedural Control Across Jurisdictions" },
];

export function CredentialTicker() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="ticker-wrap" aria-hidden="true">
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
