"use client";

import { useState, useEffect } from "react";
import { AllianceSecurityCenter } from "@/components/alliance/AllianceSecurityCenter";

export default function AllianceSecurityPage() {
  const [attestations, setAttestations] = useState<
    Array<{ id: string; label: string; attested: boolean; attested_at?: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alliance/security-attestations")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.attestations) setAttestations(data.attestations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAttest(id: string) {
    const res = await fetch("/api/alliance/security-attestations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attestation_id: id }),
    });
    if (res.ok) {
      const now = new Date().toISOString();
      setAttestations((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, attested: true, attested_at: now } : a
        )
      );
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "#080808", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.3em]"
            style={{ color: "rgba(198,165,90,0.55)" }}
          >
            Alliance Partner Portal
          </p>
          <h1
            className="text-3xl font-light"
            style={{
              fontFamily: "var(--font-playfair),Georgia,serif",
              color: "#C6A55A",
            }}
          >
            Security Center
          </h1>
          <p
            className="text-sm leading-relaxed max-w-xl"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Security Attestation Required — complete all items before receiving client documents.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Loading attestations…
            </p>
          </div>
        ) : (
          <AllianceSecurityCenter
            attestations={attestations}
            onAttest={handleAttest}
          />
        )}
      </div>
    </div>
  );
}
