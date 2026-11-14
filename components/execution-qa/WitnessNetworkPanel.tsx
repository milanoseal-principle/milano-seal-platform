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
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/witness-network")
      .then(async r => {
        const d = await r.json().catch(() => null);
        // A failed read is not an empty network.
        if (!r.ok || !Array.isArray(d?.partners)) { setUnavailable(true); return; }
        setPartners(d.partners);
      })
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</p>;
  if (unavailable) return (
    <div role="alert" className="rounded border px-6 py-10 text-center" style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.04)" }}>
      <p className="font-mono text-sm" style={{ color: "rgba(254,202,202,0.9)" }}>The network could not be loaded. This is not an empty list; reload to try again.</p>
    </div>
  );
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
