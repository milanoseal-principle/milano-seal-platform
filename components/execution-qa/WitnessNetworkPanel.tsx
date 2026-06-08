"use client";
import { useEffect, useState } from "react";

interface Partner {
  id: string;
  name: string;
  partner_type: string;
  county?: string;
  city?: string;
  state?: string;
  availability_status: string;
  credential_status: string;
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  WITNESS: "Witness",
  BACKUP_NOTARY: "Backup Notary",
  MOBILE_NOTARY: "Mobile Notary",
  RON_NOTARY: "RON Notary",
  APOSTILLE_RUNNER: "Apostille Runner",
  TRANSLATOR: "Translator",
  COURIER_SUPPORT: "Courier Support",
  DOCUMENT_PREP_SUPPORT: "Document Prep",
};

export function WitnessNetworkPanel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/witness-network")
      .then(r => r.json())
      .then(d => setPartners(d.partners ?? []))
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</p>;
  if (partners.length === 0) return (
    <div className="rounded border px-6 py-10 text-center" style={{ borderColor: "rgba(212,175,55,0.1)", background: "rgba(255,255,255,0.02)" }}>
      <p className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No partners in network yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {partners.map(p => (
        <div key={p.id} className="rounded border px-4 py-3 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(212,175,55,0.1)" }}>
          <div>
            <p className="font-mono text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{p.name}</p>
            <p className="font-mono text-[9px] mt-0.5" style={{ color: "rgba(212,175,55,0.5)" }}>
              {PARTNER_TYPE_LABELS[p.partner_type] ?? p.partner_type} · {p.city ?? ""}{p.city && p.county ? " · " : ""}{p.county ?? ""}
            </p>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              color: p.availability_status === "AVAILABLE" ? "#22c55e" : "rgba(255,255,255,0.35)",
              border: `1px solid ${p.availability_status === "AVAILABLE" ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
              background: p.availability_status === "AVAILABLE" ? "rgba(34,197,94,0.08)" : "transparent",
            }}>
            {p.availability_status.replace("_", " ")}
          </span>
        </div>
      ))}
    </div>
  );
}
