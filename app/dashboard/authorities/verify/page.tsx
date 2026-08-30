export const dynamic = "force-dynamic";

import Link from "next/link";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  operationalDestinationCountry,
  operationalDocumentType,
  operationalMatterDisplayId,
  resolveOperationalMatterState,
  stateLabel,
  type OperationalMatterSourceRow,
} from "@/lib/matter/canonicalOperationalRead";
import { deriveAuthorityFreshness } from "@/lib/authorities/freshness";

interface PageProps {
  searchParams: Promise<{
    matter?: string;
    deal?: string;
    country?: string;
    focus?: string;
  }>;
}

interface AuthorityRow {
  id: string;
  name: string;
  authority_type: string;
  country: string;
  city: string | null;
  accepted_documents: string[] | null;
  language_rules: string | null;
  apostille_required: boolean | null;
  legalization_required: boolean | null;
  translation_required: boolean | null;
  document_age_limit_days: number | null;
  ron_accepted: boolean | null;
  rejection_triggers: string[] | null;
  source_confidence: string | null;
  last_verified_at: string | null;
  notes: string | null;
  updated_at: string | null;
}

interface MatterRow extends OperationalMatterSourceRow {
  id: string;
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function booleanLabel(value: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Unknown";
}

export default async function AuthorityVerifyPage({ searchParams }: PageProps) {
  await requireDashboardAccess();
  const params = await searchParams;
  const supabase = createAdminClient();

  const matterId = params.matter?.trim() || null;
  const dealId = params.deal?.trim() || null;
  let selectedMatter: MatterRow | null = null;

  if (matterId || dealId) {
    let query = supabase
      .from("deals")
      .select(
        "id, deal_id, client_name, full_name, status, deal_status, destination_country, country, document_type, document, service_type, execution_truth, due_at, sla_deadline",
      );

    query = matterId ? query.eq("id", matterId) : query.eq("deal_id", dealId!);
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("[authority-verify] selected Matter read failed:", error.message);
    } else if (data) {
      selectedMatter = data as MatterRow;
    }
  }

  const selectedCountry =
    operationalDestinationCountry(selectedMatter ?? {}) ??
    params.country?.trim() ??
    null;

  let authorityQuery = supabase
    .from("receiving_authorities")
    .select(
      "id, name, authority_type, country, city, accepted_documents, language_rules, apostille_required, legalization_required, translation_required, document_age_limit_days, ron_accepted, rejection_triggers, source_confidence, last_verified_at, notes, updated_at",
    )
    .order("country", { ascending: true })
    .order("name", { ascending: true });

  if (selectedCountry) {
    authorityQuery = authorityQuery.ilike("country", selectedCountry);
  }

  const { data: authoritiesData, error: authoritiesError } = await authorityQuery;
  const authorities = (authoritiesData ?? []) as AuthorityRow[];
  const selectedState = selectedMatter
    ? resolveOperationalMatterState(selectedMatter).state
    : null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A55A]/55">
              Authority Operations Center
            </p>
            <h1 className="mt-2 font-serif text-2xl font-normal text-[#F4E5B8]">
              Authority Verification Evidence
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
              Production receiving-authority records only. Confidence is read from
              Supabase; this workspace does not fabricate or locally promote authority
              status.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(matterId || dealId || selectedCountry) && (
              <Link
                href="/dashboard/authorities/verify"
                className="rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/55 hover:border-[#C6A55A]/30"
              >
                Clear Focus
              </Link>
            )}
            <Link
              href="/dashboard/authorities"
              className="rounded-lg border border-[#C6A55A]/20 bg-[#C6A55A]/[0.04] px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#E4CA8C]/75 hover:border-[#C6A55A]/40"
            >
              Authority Operations Center
            </Link>
          </div>
        </div>
      </section>

      {selectedMatter ? (
        <section className="rounded-xl border border-white/[0.07] bg-[#090909] p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
                Matter
              </p>
              <Link
                href={`/dashboard/deals/${encodeURIComponent(selectedMatter.id)}`}
                className="mt-1 block font-mono text-[11px] text-[#E4CA8C] hover:underline"
              >
                {operationalMatterDisplayId(selectedMatter)}
              </Link>
            </div>
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
                State
              </p>
              <p className="mt-1 text-[11px] capitalize text-white/45">
                {stateLabel(selectedState)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
                Destination
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                {operationalDestinationCountry(selectedMatter) ?? "Unknown"}
              </p>
            </div>
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-white/20">
                Document
              </p>
              <p className="mt-1 text-[11px] text-white/45">
                {operationalDocumentType(selectedMatter) ?? "Unknown"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {authoritiesError ? (
        <section className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-red-300/70">
            Authority Source Unavailable
          </p>
          <p className="mt-2 text-xs leading-5 text-white/45">
            Receiving-authority data could not be read. Do not infer approval or
            acceptance from this failure.
          </p>
        </section>
      ) : authorities.length === 0 ? (
        <section className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-5">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200/70">
            Verification Required
          </p>
          <h2 className="mt-2 font-serif text-xl text-white/80">
            No production authority record for {selectedCountry ?? "this destination"}
          </h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45">
            The database contains no matching receiving-authority record. Keep the
            Matter in review until an approved authority record is created through the
            governed authority workflow.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/45">
                Production Authority Records
              </p>
              <h2 className="mt-1 font-serif text-xl text-white/80">
                {selectedCountry ? `${selectedCountry} authority evidence` : "All receiving authorities"}
              </h2>
            </div>
            <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/20">
              {authorities.length} records
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {authorities.map((authority) => (
              <article
                key={authority.id}
                className="rounded-xl border border-white/[0.07] bg-[#090909] p-4 sm:p-5"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#C6A55A]/50">
                      {authority.authority_type}
                    </p>
                    <h3 className="mt-1 text-sm font-medium text-white/75">
                      {authority.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-white/35">
                      {[authority.city, authority.country].filter(Boolean).join(", ")}
                    </p>
                  </div>

                  <span className="rounded border border-[#C6A55A]/15 bg-[#C6A55A]/[0.04] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.13em] text-[#E4CA8C]/70">
                    {deriveAuthorityFreshness({ sourceReference: null, verifiedAt: authority.last_verified_at, reviewDueAt: null, confidence: authority.source_confidence }).status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">Apostille</p>
                    <p className="mt-1 text-[11px] text-white/45">{booleanLabel(authority.apostille_required)}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">Legalization</p>
                    <p className="mt-1 text-[11px] text-white/45">{booleanLabel(authority.legalization_required)}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">Translation</p>
                    <p className="mt-1 text-[11px] text-white/45">{booleanLabel(authority.translation_required)}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">RON Accepted</p>
                    <p className="mt-1 text-[11px] text-white/45">{booleanLabel(authority.ron_accepted)}</p>
                  </div>
                </div>

                {authority.accepted_documents?.length ? (
                  <div className="mt-4">
                    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">Accepted Documents</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      {authority.accepted_documents.join(" · ")}
                    </p>
                  </div>
                ) : null}

                {authority.rejection_triggers?.length ? (
                  <div className="mt-4 rounded-lg border border-red-500/15 bg-red-500/[0.03] p-3">
                    <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-red-300/60">Rejection Triggers</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      {authority.rejection_triggers.join(" · ")}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 border-t border-white/[0.05] pt-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/20">Last Verified</p>
                  <p className="mt-1 text-[11px] text-white/35">
                    {formatDate(authority.last_verified_at)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
