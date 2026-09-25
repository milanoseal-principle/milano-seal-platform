import { loadMatterExecutionIntelligence } from '@/lib/intelligence/execution-brain/executionBrainServer';
import { authorityFact } from '@/lib/intelligence/execution-brain/stateAuthorityProvenance';
import { getHagueCountryProfile } from '@/lib/milano-seal/global-acceptance/hague-country-registry';

const human = (value: string | null | undefined) => (value ? value.replaceAll('_', ' ').toLowerCase() : 'unknown');

// AUTHORITY ROUTE — routing posture from governed route intelligence and
// source-backed authority provenance. Hague status alone never proves
// acceptance; unverified authority facts read as unknown.
export async function AuthorityRoutePanel({ matterId }: { matterId: string }) {
  const loaded = await loadMatterExecutionIntelligence(matterId);
  if (!loaded) return null;
  const { route, authority, intelligence } = loaded;
  const hague = route.destination ? getHagueCountryProfile(route.destination)?.hagueStatus ?? 'unknown' : 'unknown';
  const competent =
    route.issuingLane === 'federal'
      ? route.federalAgency
        ? `U.S. Department of State (federal: ${route.federalAgency})`
        : 'U.S. Department of State (federal)'
      : authority?.record.competent_authority ?? authority?.record.authority_name ?? 'Not resolved';

  const rows: Array<[string, string]> = [
    ['Origin', `${human(route.documentCategory)} ${route.documentCategorySource === 'operator' ? '(operator-confirmed)' : '(heuristic)'}`],
    ['State/Federal', human(route.issuingLane)],
    ['Hague/Non-Hague', `${human(hague)} · ${route.routeLabel.toLowerCase()}`],
    ['Competent Authority', competent],
    ['Authority Evidence', authority ? human(authority.evaluation.status) : 'No state authority resolved'],
    ['Source Freshness', authority?.record.next_review_at ? `Review due ${String(authority.record.next_review_at).slice(0, 10)}` : 'No review window recorded'],
    ['Submission Method', authority ? human(authorityFact(authority.record, 'apostille_submission_method')) : 'unknown'],
    ['Review Status', intelligence.authorityRoute.status === 'READY' ? 'No route review outstanding' : human(intelligence.authorityRoute.status)],
  ];

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C6A65B]">Authority Route</p>
      <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">Authentication routing</h2>
      <dl className="mt-4 space-y-2 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 border-b border-white/[0.05] pb-2 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-white/40">{label}</dt>
            <dd className="break-words text-[#F6F1E6]/80 sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>
      {[...intelligence.authorityRoute.reasons, ...(authority?.evaluation.reasons ?? [])].length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-white/55">
          {[...intelligence.authorityRoute.reasons, ...(authority?.evaluation.reasons ?? [])].map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] text-white/45">{route.acceptanceNotice}</p>
    </section>
  );
}
