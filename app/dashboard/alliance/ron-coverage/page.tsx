export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { summarizeRonCoverage } from "@/lib/alliance/ron/ronCoverageScoring";
import type { RonPartnerRecord } from "@/lib/alliance/ron/types";
import { RONCoverageMap } from "@/components/dashboard/alliance/RONCoverageMap";
import { RONStateCoverageBoard } from "@/components/dashboard/alliance/RONStateCoverageBoard";
import { RONPartnerVerificationQueue } from "@/components/dashboard/alliance/RONPartnerVerificationQueue";
import { RONPartnerRegistry } from "@/components/dashboard/alliance/RONPartnerRegistry";
import { RONDispatchReadiness } from "@/components/dashboard/alliance/RONDispatchReadiness";

interface NotaryApplicationRow {
  id: string;
  full_name: string;
  email: string;
  state_commissioned: string;
  commission_number: string | null;
  commission_expiration: string | null;
  ron_authorized: boolean | null;
  ron_platforms_used: string[] | null;
  mobile_notary_available: boolean | null;
  languages: string[] | null;
  availability: string | null;
  preferred_service_area: string | null;
  e_and_o_insurance_provider: string | null;
  e_and_o_policy_limit: string | null;
  background_check_status: string | null;
  apostille_experience: boolean | null;
  international_document_experience: boolean | null;
  shipping_dropoff_access: boolean | null;
  status: string;
  reviewed_at: string | null;
  updated_at: string | null;
}

function toPartner(row: NotaryApplicationRow): RonPartnerRecord {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    stateCommissioned: row.state_commissioned,
    commissionNumber: row.commission_number,
    commissionExpiration: row.commission_expiration,
    ronAuthorized: Boolean(row.ron_authorized),
    ronPlatforms: row.ron_platforms_used ?? [],
    mobileAvailable: Boolean(row.mobile_notary_available),
    languages: row.languages ?? [],
    availability: row.availability,
    serviceArea: row.preferred_service_area,
    eoProvider: row.e_and_o_insurance_provider,
    eoPolicyLimit: row.e_and_o_policy_limit,
    backgroundCheckStatus: row.background_check_status,
    apostilleExperience: Boolean(row.apostille_experience),
    internationalDocumentExperience: Boolean(row.international_document_experience),
    shippingDropoffAccess: Boolean(row.shipping_dropoff_access),
    status: row.status,
    reviewedAt: row.reviewed_at,
    updatedAt: row.updated_at,
  };
}

export default async function RonCoveragePage() {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notary_applications")
    .select("id, full_name, email, state_commissioned, commission_number, commission_expiration, ron_authorized, ron_platforms_used, mobile_notary_available, languages, availability, preferred_service_area, e_and_o_insurance_provider, e_and_o_policy_limit, background_check_status, apostille_experience, international_document_experience, shipping_dropoff_access, status, reviewed_at, updated_at")
    .order("created_at", { ascending: false });

  const partners = error ? [] : ((data ?? []) as NotaryApplicationRow[]).map(toPartner);
  const summary = summarizeRonCoverage(partners);

  const cards = [
    ["Target states", summary.targetStates],
    ["States with applicants", summary.statesWithApplicants],
    ["RON-ready partners", summary.ronReadyPartners],
    ["Mobile fallback", summary.mobileFallbackPartners],
    ["Priority dispatch", summary.priorityDispatchPartners],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A55A]/55">Alliance Execution Network</p>
            <h1 className="mt-2 font-serif text-2xl font-normal text-[#F4E5B8]">RON Coverage Command</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
              State-by-state recruiting, credential verification, mobile fallback, and partner readiness. This surface does not determine legal RON availability or authorize Matter execution.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/partners/ron-notary-alliance" target="_blank" className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55 hover:border-[#C6A55A]/30">Public Alliance Page</Link>
            <Link href="/dashboard/alliance" className="rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#E4CA8C]/75 hover:border-[#C6A55A]/40">Alliance Dashboard</Link>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-red-300/70">Partner Source Unavailable</p>
          <p className="mt-2 text-xs leading-5 text-white/45">Notary application data could not be read. The dashboard remains fail-closed and does not infer partner readiness.</p>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-xl border border-white/[0.06] bg-[#090909] p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">{label}</p>
            <p className="mt-2 font-serif text-2xl text-[#E4CA8C]">{value}</p>
          </article>
        ))}
      </section>

      <RONCoverageMap partners={partners} />
      <RONDispatchReadiness partners={partners} />
      <RONPartnerVerificationQueue partners={partners} />
      <RONStateCoverageBoard partners={partners} />
      <RONPartnerRegistry partners={partners} />
    </div>
  );
}
