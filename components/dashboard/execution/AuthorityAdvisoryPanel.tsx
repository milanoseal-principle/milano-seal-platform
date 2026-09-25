import { createAdminClient } from '@/lib/supabase/admin';
import { loadLogisticsContext } from '@/lib/intelligence/execution-brain/authorityLogisticsServer';
import {
  ESTIMATE_NOTICE,
  composeEstimatedTimeline,
  evaluateProcessingAdvisory,
  type ProcessingObservation,
} from '@/lib/intelligence/execution-brain/processingAdvisory';
import { AuthorityObservationForm } from '@/components/dashboard/execution/AuthorityObservationForm';

const day = (value: string | null) => (value ? value.slice(0, 10) : 'Not recorded');

// CURRENT AUTHORITY ADVISORY + ESTIMATED TIMELINE. Source-backed, expiring
// estimates only; never a guaranteed completion date.
export async function AuthorityAdvisoryPanel({ matterId }: { matterId: string }) {
  const context = await loadLogisticsContext(matterId);
  if (!context?.packet?.authorityId) return null;
  const authorityId = context.packet.authorityId;
  const serviceType = context.packet.routeType === 'florida_dos_notarial_certificate' ? 'notarial_certificate' : 'apostille';
  const supabase = createAdminClient();
  const [{ data: observations }, { count }] = await Promise.all([
    supabase
      .from('authority_processing_observations')
      .select('id, authority_id, service_type, source_url, source_title, source_date, observed_processing_date, estimated_days, observation_method, confidence, observed_at, expires_at, operator_override, override_reason, verified_by')
      .eq('authority_id', authorityId)
      .order('observed_at', { ascending: false })
      .limit(50),
    supabase.from('authority_review_required').select('id', { count: 'exact', head: true }).eq('authority_id', authorityId).eq('review_status', 'PENDING'),
  ]);
  const advisory = evaluateProcessingAdvisory((observations ?? []) as ProcessingObservation[], { serviceType, pendingSourceReviews: count ?? 0 });
  const outbound = context.legs.find((leg) => leg.leg_type === 'outbound_to_authority' && leg.custody_status !== 'exception');
  const returnLeg = context.legs.find((leg) => leg.leg_type === 'return_from_authority' && leg.custody_status !== 'exception');
  const timeline = composeEstimatedTimeline({
    outboundCarrierDays: outbound?.rate_snapshot?.estimated_days ?? null,
    advisory,
    returnCarrierDays: returnLeg?.rate_snapshot?.estimated_days ?? null,
    returnRequired: context.packet.returnShippingRequired === true,
  });

  const rows: Array<[string, string]> = [
    ['Current advisory', advisory.status.replace('_', ' ').toLowerCase()],
    ['Estimated days', advisory.estimatedDays === null ? 'Unavailable' : `${advisory.estimatedDays} days`],
    ['Official source', advisory.officialSource ?? 'None recorded'],
    ['Observed date', day(advisory.observedProcessingDate ?? advisory.observedAt)],
    ['Last verified', day(advisory.lastVerified)],
    ['Confidence', advisory.confidence ? advisory.confidence.replace('_', ' ').toLowerCase() : '—'],
    ['Expiration', day(advisory.expiresAt)],
  ];

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C6A65B]">Current Authority Advisory</p>
          <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">Processing advisory</h2>
        </div>
        <span className="rounded-full border border-[#C6A65B]/35 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#C6A65B]">
          {advisory.status.replace('_', ' ')}
        </span>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-200/80">{ESTIMATE_NOTICE}</p>
      <dl className="mt-4 space-y-2 text-xs">
        {rows.map(([name, value]) => (
          <div key={name} className="flex flex-col gap-1 border-b border-white/[0.05] pb-2 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-white/40">{name}</dt>
            <dd className="break-words text-[#F6F1E6]/80 sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>
      {advisory.reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-white/55">
          {advisory.reasons.map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-xl border border-[#C6A65B]/20 bg-[#C6A65B]/[0.035] p-4">
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#C6A65B]">Estimated Timeline</p>
        <ul className="mt-2 space-y-1 text-xs text-[#F6F1E6]/80">
          {timeline.components.map((component) => (
            <li key={component.label} className="flex justify-between gap-3">
              <span>{component.label}</span>
              <span className="text-white/55">{component.days === null ? 'unknown' : `${component.days} days`}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[#F6F1E6]">
          Total: {timeline.totalEstimatedDays === null ? 'not yet estimable' : `about ${timeline.totalEstimatedDays} days`}
        </p>
        <p className="mt-1 text-[11px] text-amber-200/80">{timeline.notice}</p>
      </div>

      <AuthorityObservationForm authorityId={authorityId} serviceType={serviceType} />
    </section>
  );
}
