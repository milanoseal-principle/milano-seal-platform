"use client";

import { useState, useEffect, useCallback } from "react";

interface NotaryApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  state_commissioned: string;
  commission_number: string;
  commission_expiration: string | null;
  ron_authorized: boolean;
  e_and_o_insurance_provider: string | null;
  e_and_o_policy_limit: string | null;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  APPLICATION_RECEIVED: "border-yellow-500/30 text-yellow-400/70",
  DOCUMENTS_PENDING: "border-yellow-500/20 text-yellow-400/50",
  CREDENTIAL_REVIEW: "border-[#C6A55A]/30 text-[#C6A55A]/70",
  INTERVIEW_REQUIRED: "border-blue-500/30 text-blue-400/60",
  APPROVED: "border-green-500/30 text-green-400/70",
  ACTIVE: "border-green-500/40 text-green-400/80",
  SUSPENDED: "border-orange-500/30 text-orange-400/60",
  REJECTED: "border-red-500/20 text-red-400/50",
  EXPIRED_CREDENTIALS: "border-red-500/15 text-red-400/40",
};

const VALID_STATUSES = [
  "APPLICATION_RECEIVED", "DOCUMENTS_PENDING", "CREDENTIAL_REVIEW",
  "INTERVIEW_REQUIRED", "APPROVED", "ACTIVE", "SUSPENDED",
  "REJECTED", "EXPIRED_CREDENTIALS",
];

export function NotaryNetworkPanel() {
  const [applications, setApplications] = useState<NotaryApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notary/credentials");
      const json = await res.json() as { data?: NotaryApplication[]; error?: string };
      if (!res.ok) setError(json.error ?? "Failed to load");
      else setApplications(json.data ?? []);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    await fetch("/api/notary/credentials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  const statusGroups = ["all", "APPLICATION_RECEIVED", "CREDENTIAL_REVIEW", "APPROVED", "ACTIVE", "REJECTED"];
  const filtered = filter === "all" ? applications : applications.filter(a => a.status === filter);

  return (
    <div className="relative z-10 mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.32em] text-[#C6A55A]/60">
            Notary Network / Credential Review
          </p>
          <h1 className="font-serif text-3xl text-[#E4D2A4]">Notary Network</h1>
          <p className="mt-2 text-sm text-white/40">Review notary applications and manage credentialed network.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusGroups.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.1em] rounded border transition-colors ${
                filter === s ? "border-[#C6A55A]/50 text-[#C6A55A] bg-[#C6A55A]/[0.06]" : "border-white/[0.06] text-white/30 hover:border-white/20"
              }`}
            >
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="font-mono text-[10px] text-[#C6A55A]/40 uppercase tracking-widest">Loading…</p>
      ) : error ? (
        <div className="rounded border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-200/70">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded border border-[#C6A55A]/10 bg-[#0D0B08] p-10 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6A55A]/40">No applications</p>
          <p className="mt-3 text-sm text-white/25">Applications submitted via /notary/join appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-[#C6A55A]/10 bg-[#0D0B08]">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="border-b border-[#C6A55A]/10 font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A55A]/55">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Commission #</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">RON</th>
                <th className="px-4 py-3">E&amp;O Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(a => (
                <tr key={a.id} className="text-white/60">
                  <td className="px-4 py-4 text-white/80">{a.full_name}</td>
                  <td className="px-4 py-4 font-mono text-[10px]">{a.email}</td>
                  <td className="px-4 py-4 font-mono">{a.state_commissioned}</td>
                  <td className="px-4 py-4 font-mono text-[10px]">{a.commission_number}</td>
                  <td className="px-4 py-4">{a.commission_expiration ? new Date(a.commission_expiration).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`font-mono text-[9px] ${a.ron_authorized ? "text-green-400/70" : "text-white/20"}`}>
                      {a.ron_authorized ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-white/40">{a.e_and_o_insurance_provider ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span className={`font-mono text-[8px] px-2 py-0.5 rounded border uppercase ${STATUS_COLORS[a.status] ?? "border-white/10 text-white/30"}`}>
                      {a.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="bg-[#0D0B08] border border-[#C6A55A]/15 px-2 py-1 font-mono text-[8px] text-white/60 outline-none focus:border-[#C6A55A]/40 rounded-sm"
                      defaultValue=""
                      onChange={e => { if (e.target.value) { void updateStatus(a.id, e.target.value); e.target.value = ""; } }}
                    >
                      <option value="">— set status —</option>
                      {VALID_STATUSES.filter(s => s !== a.status).map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
