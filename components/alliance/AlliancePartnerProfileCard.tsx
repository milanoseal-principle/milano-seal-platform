"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Globe } from "lucide-react";

type Partner = {
  firm_name?: string;
  contact_name?: string;
  partner_type?: string;
  status: string;
  jurisdiction_codes?: string[];
  document_categories?: string[];
  routing_eligible?: boolean;
  toolbelt_completed?: boolean;
  compliance_verified?: boolean;
  security_attested?: boolean;
};

type Props = {
  partner: Partner;
};

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  active: { bg: "rgba(63,164,122,0.1)", color: "#3FA47A", border: "rgba(63,164,122,0.25)" },
  pending: { bg: "rgba(198,165,90,0.08)", color: "#C6A55A", border: "rgba(198,165,90,0.2)" },
  suspended: { bg: "rgba(180,50,50,0.08)", color: "rgba(255,100,100,0.7)", border: "rgba(180,50,50,0.2)" },
  inactive: { bg: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.1)" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_COLORS[status.toLowerCase()] ?? STATUS_COLORS["inactive"];
  return (
    <span
      className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {status}
    </span>
  );
}

function ReadinessRow({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle2 size={13} style={{ color: "#3FA47A", flexShrink: 0 }} />
      ) : (
        <Circle size={13} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
      )}
      <span
        className="text-[10px]"
        style={{ color: checked ? "rgba(246,241,230,0.65)" : "rgba(255,255,255,0.25)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function AlliancePartnerProfileCard({ partner }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const jurisdictions = partner.jurisdiction_codes ?? [];
  const shownJurisdictions = jurisdictions.slice(0, 5);
  const extraCount = jurisdictions.length - 5;

  const categories = partner.document_categories ?? [];

  return (
    <div
      className="rounded-sm p-6 space-y-5 transition-all duration-500"
      style={{
        background: "rgba(8,5,1,0.96)",
        border: "1px solid rgba(198,165,90,0.28)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      {/* Header */}
      <div className="space-y-1.5">
        <h2
          className="text-2xl font-light leading-tight"
          style={{
            fontFamily: "var(--font-playfair),Georgia,serif",
            color: "rgba(246,241,230,0.9)",
          }}
        >
          {partner.firm_name ?? "Unnamed Firm"}
        </h2>
        {partner.contact_name && (
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            {partner.contact_name}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {partner.partner_type && (
            <span
              className="text-[9px] font-mono uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm"
              style={{
                background: "rgba(198,165,90,0.08)",
                color: "rgba(198,165,90,0.7)",
                border: "1px solid rgba(198,165,90,0.15)",
              }}
            >
              {partner.partner_type}
            </span>
          )}
          <StatusPill status={partner.status} />
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(198,165,90,0.1)" }} />

      {/* Jurisdictions */}
      {jurisdictions.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-[9px] font-mono uppercase tracking-[0.2em]"
            style={{ color: "rgba(198,165,90,0.4)" }}
          >
            Jurisdictions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {shownJurisdictions.map((code) => (
              <span
                key={code}
                className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-sm"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <Globe size={8} />
                {code}
              </span>
            ))}
            {extraCount > 0 && (
              <span
                className="text-[9px] font-mono px-2 py-0.5 rounded-sm"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.25)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                +{extraCount} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Document categories */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-[9px] font-mono uppercase tracking-[0.2em]"
            style={{ color: "rgba(198,165,90,0.4)" }}
          >
            Document Categories
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-[9px] font-mono px-2 py-0.5 rounded-sm"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Readiness indicators */}
      <div className="space-y-2">
        <p
          className="text-[9px] font-mono uppercase tracking-[0.2em]"
          style={{ color: "rgba(198,165,90,0.4)" }}
        >
          Readiness
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <ReadinessRow label="Tool Belt" checked={partner.toolbelt_completed} />
          <ReadinessRow label="Compliance" checked={partner.compliance_verified} />
          <ReadinessRow label="Security" checked={partner.security_attested} />
          <ReadinessRow label="Routing Eligible" checked={partner.routing_eligible} />
        </div>
      </div>
    </div>
  );
}
