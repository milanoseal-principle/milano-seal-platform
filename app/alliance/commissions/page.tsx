"use client";

import { useState, useEffect } from "react";
import { AllianceCommissionLedger } from "@/components/alliance/AllianceCommissionLedger";

type CommissionStatus =
  | "NOT_ELIGIBLE"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "ON_HOLD"
  | "NEEDS_REVIEW";

type Commission = {
  id: string;
  matter_ref?: string;
  amount?: number;
  status: CommissionStatus;
  period?: string;
  notes?: string;
};

type Summary = {
  month_to_date?: number;
  year_to_date?: number;
  outstanding?: number;
};

export default function AllianceCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [summary, setSummary] = useState<Summary | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/alliance/commissions")
      .then((r) => {
        if (!r.ok) {
          if (r.status === 401) throw new Error("Session expired. Please sign in again.");
          // Show the server's explicit reason (e.g. commission tracking not yet configured).
          return r.json().catch(() => ({})).then((body: { error?: string }) => {
            throw new Error(body.error ?? "Could not load commission data. Please try again.");
          });
        }
        return r.json();
      })
      .then((data) => {
        setCommissions(data.commissions ?? []);
        setSummary(data.summary);
      })
      .catch((e) => setError(e.message ?? "Could not load commission data."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#080808", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
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
            Partner Credits
          </h1>
          <p
            className="text-sm leading-relaxed max-w-xl"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Partner Payout Status — reviewed by operator before any approval.
          </p>
        </div>

        {error && (
          <div
            className="rounded-sm px-4 py-3 text-sm"
            style={{
              background: "rgba(180,50,50,0.08)",
              border: "1px solid rgba(180,50,50,0.2)",
              color: "rgba(255,100,100,0.8)",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Loading commission records…
            </p>
          </div>
        ) : (
          <AllianceCommissionLedger commissions={commissions} summary={summary} />
        )}
      </div>
    </div>
  );
}
