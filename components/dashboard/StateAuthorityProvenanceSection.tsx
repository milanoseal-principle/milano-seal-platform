import { createAdminClient } from "@/lib/supabase/admin";
import {
  AUTHORITY_ASSET_FIELDS,
  STATE_AUTHORITY_FIELDS,
  authorityFact,
  authorityStateFee,
  evaluateStateAuthority,
  resolveOfficialAsset,
  type AuthoritySourceAsset,
  type StateAuthorityRecord,
} from "@/lib/intelligence/execution-brain/stateAuthorityProvenance";

// Issuing-side U.S. state authority provenance and the official asset
// registry. Rule facts render as "unknown" unless the record is VERIFIED from
// an official government source; nothing here is promoted locally.
export async function StateAuthorityProvenanceSection() {
  const supabase = createAdminClient();
  const [{ data: authorities, error }, { data: assets }] = await Promise.all([
    supabase.from("state_authorities").select(STATE_AUTHORITY_FIELDS).order("state_code"),
    supabase.from("authority_source_assets").select(AUTHORITY_ASSET_FIELDS).order("updated_at", { ascending: false }),
  ]);
  const now = new Date();
  const records = (authorities ?? []) as unknown as StateAuthorityRecord[];
  const assetRows = (assets ?? []) as AuthoritySourceAsset[];

  return (
    <section className="rounded-xl border border-white/[0.07] bg-[#0A0A0A] p-5 sm:p-6">
      <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#C6A65B]/70">State Authority Provenance</p>
      <h2 className="mt-2 font-serif text-xl text-[#F6F1E6]">Issuing authorities &amp; official assets</h2>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-white/45">
        Only an official government source recorded by an operator may be verified. Unverified rule facts
        read as unknown.
      </p>
      {error && <p className="mt-3 text-xs text-[#E0876E]">State authority provenance is unavailable.</p>}
      {!error && records.length === 0 && <p className="mt-3 text-xs text-white/45">No state authorities registered.</p>}
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {records.map((authority) => {
          const evaluation = evaluateStateAuthority(authority, now);
          const form = resolveOfficialAsset(assetRows, { authorityId: authority.id ?? undefined });
          const fee = authorityStateFee(authority, now);
          const authorityAssets = assetRows.filter((asset) => asset.authority_id === authority.id);
          return (
            <article key={authority.id ?? authority.authority_name} className="rounded-lg border border-white/[0.06] bg-black/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">{authority.state_code}</p>
                  <p className="mt-1 text-sm text-[#F6F1E6]">{authority.authority_name}</p>
                </div>
                <span className="rounded-full border border-[#C6A65B]/35 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#C6A65B]">
                  {evaluation.status.replaceAll("_", " ")}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-y-1.5 text-[11px]">
                {([
                  ["RON (state notary)", authorityFact(authority, "ron_supported_by_state_notary", now)],
                  ["Electronic submission", authorityFact(authority, "electronic_document_submission_status", now)],
                  ["Papering out", authorityFact(authority, "papering_out_rule", now)],
                  ["County clerk pre-authentication", authorityFact(authority, "county_clerk_pre_authentication", now)],
                  ["Submission method", authorityFact(authority, "apostille_submission_method", now)],
                  ["State fee (pass-through)", fee === null ? "unknown" : `$${fee.toFixed(2)}`],
                  ["Next review", authority.next_review_at ? new Date(authority.next_review_at).toISOString().slice(0, 10) : "not recorded"],
                  ["Official form", form.status.replaceAll("_", " ")],
                ] as const).map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 border-b border-white/[0.04] pb-1">
                    <dt className="text-white/40">{label}</dt>
                    <dd className="text-right text-[#F6F1E6]/75">{value.replaceAll("_", " ")}</dd>
                  </div>
                ))}
              </dl>
              {evaluation.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-[11px] text-white/50">
                  {evaluation.reasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              )}
              {authorityAssets.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-white/[0.05] pt-2 text-[11px]">
                  {authorityAssets.map((asset) => (
                    <li key={asset.id} className="text-white/55">
                      <span className="text-[#F6F1E6]/80">{asset.title}</span> · {asset.asset_type.replaceAll("_", " ")} ·{" "}
                      {asset.status} · v{asset.source_version ?? "?"} · sha256 {asset.sha256?.slice(0, 12)}… ·{" "}
                      {asset.verified_at ? `verified ${asset.verified_at.slice(0, 10)}` : "operator verification required"}
                      {asset.official_source_url && (
                        <>
                          {" "}
                          ·{" "}
                          <a href={asset.official_source_url} target="_blank" rel="noreferrer" className="text-[#C6A65B] underline-offset-2 hover:underline">
                            official source
                          </a>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
