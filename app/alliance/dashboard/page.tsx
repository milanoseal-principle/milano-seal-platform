import Link from "next/link";
import {
  FileText,
  Calendar,
  Users,
  DollarSign,
  Link2,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  evaluateRoutingEligibility,
  type PartnerProfile,
} from "@/lib/allianceEligibility";

// Stub partner profile — replaced by real Supabase query when partner accounts exist
const STUB_PARTNER: PartnerProfile = {
  id: "stub",
  firm_name: "Your Firm",
  onboarding_status: "under_review",
  account_state: "SAFE",
  credentials_verified: false,
  toolbelt_completion_percent: 55,
  compliance_ready: false,
  availability: "active",
};

export default function AllianceDashboardPage() {
  const partner = STUB_PARTNER;
  const { eligible, blockers } = evaluateRoutingEligibility(partner);

  return (
    <div className="space-y-6">
      {/* Welcome + Eligibility */}
      <div className="ap-card ap-card-body flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="ap-eyebrow">Alliance Partner</div>
          <h1
            className="text-2xl font-semibold text-gray-900 mt-1"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Partner Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Coordinate cross-border document execution for your clients.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className={`ap-eligible ${eligible ? "yes" : "no"}`}>
            {eligible ? (
              <>
                <CheckCircle2 size={13} />
                ROUTING ELIGIBLE
              </>
            ) : (
              <>
                <AlertCircle size={13} />
                NOT ROUTING ELIGIBLE
              </>
            )}
          </div>
          {!eligible && blockers.length > 0 && (
            <div className="text-xs text-gray-400 text-right max-w-xs">
              {blockers[0]}
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: FileText,
            label: "Active Matters",
            value: "—",
            sub: "No active matters",
          },
          {
            icon: Calendar,
            label: "This Month",
            value: "—",
            sub: "Referred matters",
          },
          {
            icon: Users,
            label: "Total Referred",
            value: "—",
            sub: "All time",
          },
          {
            icon: DollarSign,
            label: "Outstanding Commission",
            value: "$0.00",
            sub: "Pending payout",
          },
        ].map((m) => (
          <div key={m.label} className="ap-card">
            <div className="ap-metric">
              <div className="flex items-center gap-2 mb-3">
                <div className="ap-action-icon">
                  <m.icon size={16} color="#d4af37" />
                </div>
              </div>
              <div className="ap-metric-value">{m.value}</div>
              <div className="ap-metric-label mt-2">{m.label}</div>
              <div className="ap-metric-sub">{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 ap-card">
          <div className="ap-card-header">
            <h3 className="ap-card-title">Quick Actions</h3>
          </div>
          <div className="ap-card-body grid grid-cols-2 gap-3">
            <button className="ap-action-tile">
              <div className="ap-action-icon">
                <Link2 size={16} color="#6b7280" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Create Intake Link
                </div>
                <div className="text-xs text-gray-500">
                  White-label referral link
                </div>
              </div>
            </button>
            <button className="ap-action-tile">
              <div className="ap-action-icon">
                <FileText size={16} color="#6b7280" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Refer a Client
                </div>
                <div className="text-xs text-gray-500">New matter referral</div>
              </div>
            </button>
            <button className="ap-action-tile">
              <div className="ap-action-icon">
                <DollarSign size={16} color="#6b7280" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Commission Statement
                </div>
                <div className="text-xs text-gray-500">View payout history</div>
              </div>
            </button>
            <button className="ap-action-tile">
              <div className="ap-action-icon">
                <MessageSquare size={16} color="#6b7280" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Contact Milano Seal
                </div>
                <div className="text-xs text-gray-500">Secure message</div>
              </div>
            </button>
          </div>
        </div>

        <div className="ap-card">
          <div className="ap-card-header">
            <h3 className="ap-card-title">Account Status</h3>
          </div>
          <div className="ap-card-body space-y-0">
            <div className="ap-kv">
              <span className="ap-kv-k">Onboarding</span>
              <span className="ap-kv-v capitalize">
                {partner.onboarding_status.replace(/_/g, " ")}
              </span>
            </div>
            <div className="ap-kv">
              <span className="ap-kv-k">Account State</span>
              <span
                className={`ap-kv-v font-semibold ${partner.account_state === "SAFE" ? "text-emerald-600" : "text-amber-600"}`}
              >
                {partner.account_state}
              </span>
            </div>
            <div className="ap-kv">
              <span className="ap-kv-k">Credentials</span>
              <span
                className={
                  partner.credentials_verified
                    ? "text-emerald-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
              >
                {partner.credentials_verified ? "Verified" : "Pending"}
              </span>
            </div>
            <div className="ap-kv">
              <span className="ap-kv-k">Tool Belt</span>
              <span className="ap-kv-v font-mono text-sm">
                {partner.toolbelt_completion_percent}%
              </span>
            </div>
            <div className="ap-kv">
              <span className="ap-kv-k">Compliance</span>
              <span
                className={
                  partner.compliance_ready
                    ? "text-emerald-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
              >
                {partner.compliance_ready ? "Ready" : "Incomplete"}
              </span>
            </div>
            <div className="ap-kv">
              <span className="ap-kv-k">Availability</span>
              <span className="ap-kv-v capitalize">{partner.availability}</span>
            </div>
          </div>

          {!eligible && (
            <div className="px-4 pb-4">
              <div className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">
                Blockers
              </div>
              <ul className="space-y-1">
                {blockers.map((b) => (
                  <li key={b} className="text-xs text-red-500 flex gap-2">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Referred matters placeholder */}
      <div className="ap-card">
        <div className="ap-card-header">
          <h3 className="ap-card-title">Referred Matters</h3>
          <Link href="/alliance/jobs" className="ap-btn ghost text-xs">
            View Available Jobs →
          </Link>
        </div>
        <div className="ap-empty">
          <TrendingUp size={32} className="mx-auto mb-3 text-gray-300" />
          <div className="font-medium text-gray-500 mb-1">
            No referred matters yet
          </div>
          <div className="text-gray-400">
            Referred client matters will appear here once your account is
            approved and active.
          </div>
        </div>
      </div>
    </div>
  );
}
