"use client";

import { useState, useEffect } from "react";
import { Users, CheckCircle, Clock, Star, MapPin } from "lucide-react";

interface NotaryApplication {
  id: string;
  full_name: string;
  email: string;
  state_of_commission: string;
  is_ron_certified: boolean;
  is_mobile_notary: boolean;
  partner_type: string;
  status: string;
  years_experience: number;
  has_eo_insurance: boolean;
  specialties: string[];
  created_at: string;
}

interface NotaryCredential {
  id: string;
  full_name: string;
  email: string;
  state_of_commission: string;
  partner_type: string;
  confidence_score: number;
  matters_completed: number;
  active: boolean;
  is_ron_certified: boolean;
  is_mobile_notary: boolean;
}

const PARTNER_TYPE_LABELS: Record<string, string> = {
  NOTARY_PARTNER: "Notary Partner",
  RON_NOTARY: "RON Notary",
  MOBILE_NOTARY: "Mobile Notary",
  HYBRID: "Hybrid (RON + Mobile)",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400",
  UNDER_REVIEW: "bg-blue-500/10 text-blue-400",
  APPROVED: "bg-emerald-500/10 text-emerald-400",
  REJECTED: "bg-red-500/10 text-red-400",
  WAITLISTED: "bg-[#C6A55A]/10 text-[#C6A55A]",
};

export function NotaryNetworkPanel() {
  const [applications, setApplications] = useState<NotaryApplication[]>([]);
  const [credentials, setCredentials] = useState<NotaryCredential[]>([]);
  const [tab, setTab] = useState<"applications" | "active">("applications");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [appsRes, credsRes] = await Promise.all([
      fetch("/api/notary/apply"),
      fetch("/api/notary/credentials").catch(() => ({ json: async () => ({ credentials: [] }) })),
    ]);
    const appsJson = await appsRes.json();
    const credsJson = await credsRes.json();
    setApplications(appsJson.applications ?? []);
    setCredentials(credsJson.credentials ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string, rejection_reason?: string) {
    await fetch("/api/notary/apply", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, reviewed_by: "founder", rejection_reason }),
    });
    load();
  }

  const pendingCount = applications.filter(a => a.status === "PENDING").length;
  const activeCount = credentials.filter(c => c.active).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-[#C6A55A]" />
          <h2 className="text-white font-semibold text-lg">Alliance Notary Network</h2>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-mono">
              {pendingCount} pending review
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 text-xs text-[#6A6A6A]">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            {activeCount} active notaries
          </span>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1 p-1 bg-[#0A0A0A] border border-[#1A1A1A] rounded-xl w-fit">
        {(["applications", "active"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? "bg-[#C6A55A] text-[#0A0A0A]" : "text-[#6A6A6A] hover:text-white"
            }`}
          >
            {t === "applications" ? `Applications (${applications.length})` : `Active Network (${activeCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-[#4A4A4A] text-sm py-6 text-center">Loading…</div>
      ) : tab === "applications" ? (
        applications.length === 0 ? (
          <div className="text-[#4A4A4A] text-sm py-8 text-center border border-[#1A1A1A] rounded-xl">
            No applications received yet.
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium">{app.full_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${STATUS_STYLES[app.status] ?? "bg-[#2A2A2A] text-[#6A6A6A]"}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#6A6A6A] flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {app.state_of_commission}
                      </span>
                      <span>{PARTNER_TYPE_LABELS[app.partner_type] ?? app.partner_type}</span>
                      {app.years_experience > 0 && <span>{app.years_experience}yr exp</span>}
                      {app.is_ron_certified && <span className="text-emerald-400">RON Certified</span>}
                      {app.is_mobile_notary && <span className="text-blue-400">Mobile</span>}
                      {app.has_eo_insurance && <span className="text-[#C6A55A]">E&amp;O Insured</span>}
                    </div>
                    <p className="text-[#4A4A4A] text-xs mt-1">{app.email} · Applied {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  {app.status === "PENDING" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateStatus(app.id, "APPROVED")}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "UNDER_REVIEW")}
                        className="px-3 py-1.5 border border-blue-500/40 text-blue-400 text-xs rounded-lg hover:bg-blue-500/10"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "REJECTED", "Does not meet current requirements.")}
                        className="px-3 py-1.5 border border-red-500/30 text-red-400 text-xs rounded-lg hover:bg-red-500/10"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        credentials.length === 0 ? (
          <div className="text-[#4A4A4A] text-sm py-8 text-center border border-[#1A1A1A] rounded-xl">
            No active notaries in network yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {credentials.filter(c => c.active).map((cred) => (
              <div key={cred.id} className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium text-sm">{cred.full_name}</p>
                    <p className="text-[#6A6A6A] text-xs mt-0.5">{PARTNER_TYPE_LABELS[cred.partner_type]} · {cred.state_of_commission}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#C6A55A]">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-mono">{cred.confidence_score}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-[#4A4A4A]">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    {cred.matters_completed} completed
                  </span>
                  {cred.is_ron_certified && <span className="text-emerald-400">RON</span>}
                  {cred.is_mobile_notary && <span className="text-blue-400">Mobile</span>}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
