"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send, AlertTriangle } from "lucide-react";

type ReferralRow = {
  referral_id: string;
  submitted_at: string;
  destination_country: string | null;
  document_type: string | null;
  status: string;
  public_next_step: string;
};

const STATUS_BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  submitted: {
    label: "Submitted",
    style: { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" },
  },
  under_review: {
    label: "Under Review",
    style: { background: "rgba(212,175,55,0.08)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.2)" },
  },
  accepted: {
    label: "Accepted",
    style: { background: "rgba(34,197,94,0.06)", color: "rgba(34,197,94,0.7)", border: "1px solid rgba(34,197,94,0.15)" },
  },
  in_execution: {
    label: "In Execution",
    style: { background: "rgba(96,165,250,0.06)", color: "rgba(96,165,250,0.7)", border: "1px solid rgba(96,165,250,0.15)" },
  },
  completed: {
    label: "Completed",
    style: { background: "rgba(52,211,153,0.08)", color: "rgba(52,211,153,0.8)", border: "1px solid rgba(52,211,153,0.2)" },
  },
  not_accepted: {
    label: "Not Accepted",
    style: { background: "rgba(180,50,50,0.06)", color: "rgba(255,100,100,0.5)", border: "1px solid rgba(180,50,50,0.15)" },
  },
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.submitted;
  return (
    <span
      className="text-[8px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm"
      style={badge.style}
    >
      {badge.label}
    </span>
  );
}

function ReferralStatusInner() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref") ?? "";

  const [refCode, setRefCode] = useState(refParam);
  const [inputCode, setInputCode] = useState(refParam);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  async function fetchReferrals(code: string) {
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/alliance/referrals?ref=${encodeURIComponent(code)}`);
      const data = await res.json();
      setReferrals(data.referrals ?? []);
      setFetched(true);
    } catch {
      setError("Could not load referral status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (refParam) {
      setRefCode(refParam);
      setInputCode(refParam);
      fetchReferrals(refParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refParam]);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setRefCode(inputCode.trim());
    fetchReferrals(inputCode.trim());
  }

  return (
    <div className="space-y-8">
      {/* CTA */}
      <div className="flex items-center justify-between">
        <div />
        <Link
          href="/alliance/referrals/new"
          className="text-[11px] font-mono uppercase tracking-[0.18em] px-4 py-2 rounded-sm transition-colors"
          style={{
            background: "rgba(212,175,55,0.08)",
            border: "1px solid rgba(212,175,55,0.2)",
            color: "#d4af37",
          }}
        >
          Submit a Referral →
        </Link>
      </div>

      {/* Lookup form */}
      {!refCode && (
        <div
          className="rounded-sm p-6 space-y-4"
          style={{ background: "rgba(8,5,1,0.96)", border: "1px solid rgba(212,175,55,0.12)" }}
        >
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
              Partner Access
            </p>
            <h2 className="text-base font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif" }}>
              Enter Your Referral Code
            </h2>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>
              Enter the referral code assigned to your partner account to view submitted referrals.
            </p>
          </div>
          <form onSubmit={handleLookup} className="flex gap-3">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="e.g. MS-PARTNER-001"
              className="flex-1 rounded-sm px-3 py-2 text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(212,175,55,0.15)",
                color: "rgba(255,255,255,0.8)",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-[0.15em] disabled:opacity-50"
              style={{
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#d4af37",
              }}
            >
              {loading ? "Loading…" : "View Status"}
            </button>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-3 rounded-sm px-4 py-3"
          style={{ background: "rgba(180,50,50,0.08)", border: "1px solid rgba(180,50,50,0.2)" }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#b43232" }} />
          <p className="text-xs" style={{ color: "rgba(255,100,100,0.8)" }}>{error}</p>
        </div>
      )}

      {/* Referral table */}
      {fetched && (
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.96)", border: "1px solid rgba(212,175,55,0.1)" }}
        >
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(212,175,55,0.08)" }}
          >
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.5)" }}>
                {refCode}
              </p>
              <h2 className="text-sm font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif", color: "rgba(255,255,255,0.75)" }}>
                Referral Status
              </h2>
            </div>
            <button
              onClick={() => { setRefCode(""); setInputCode(""); setFetched(false); setReferrals([]); }}
              className="text-[9px] font-mono uppercase tracking-[0.12em]"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Change Code
            </button>
          </div>

          {referrals.length === 0 ? (
            <div className="px-6 py-10 text-center space-y-3">
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                No referrals submitted yet.
              </p>
              <Link
                href="/alliance/referrals/new"
                className="inline-block text-[11px] font-mono uppercase tracking-[0.15em]"
                style={{ color: "rgba(212,175,55,0.6)" }}
              >
                Submit a Referral →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                    {["Submitted", "Referral ID", "Destination", "Document", "Status", "Next Step"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-[9px] font-mono uppercase tracking-[0.15em]"
                        style={{ color: "rgba(212,175,55,0.35)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r) => (
                    <tr
                      key={r.referral_id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                    >
                      <td className="px-6 py-3 font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {new Date(r.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-3 font-mono text-[10px]" style={{ color: "rgba(212,175,55,0.6)" }}>
                        {r.referral_id}
                      </td>
                      <td className="px-6 py-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {r.destination_country ?? "—"}
                      </td>
                      <td className="px-6 py-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {r.document_type ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-3 max-w-xs text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {r.public_next_step}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <p className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
              Partner-safe view only. Pricing, revenue, and matter internals are not accessible here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReferralStatusPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "rgba(4,3,1,1)", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.35em]"
            style={{ color: "rgba(212,175,55,0.6)" }}
          >
            Milano Seal Alliance
          </p>
          <h1
            className="text-4xl font-light"
            style={{ fontFamily: "var(--font-playfair),Georgia,serif", color: "#d4af37" }}
          >
            Partner Referral Status
          </h1>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.45)" }}>
            View the status of referrals submitted through your partner account.
          </p>
        </div>

        <Suspense fallback={<div className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading…</div>}>
          <ReferralStatusInner />
        </Suspense>
      </div>
    </div>
  );
}
