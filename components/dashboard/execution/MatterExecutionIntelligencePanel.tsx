import { loadMatterExecutionIntelligence } from '@/lib/intelligence/execution-brain/executionBrainServer';
import type { SectionStatus } from '@/lib/intelligence/execution-brain/executionBrain';
import { MatterExecutionBriefButton } from '@/components/dashboard/execution/MatterExecutionBriefButton';

const TONE: Record<SectionStatus, string> = {
  READY: 'text-[#C6A65B]',
  REVIEW_REQUIRED: 'text-amber-200',
  BLOCKED: 'text-[#E0876E]',
  NOT_APPLICABLE: 'text-white/35',
};

const LABELS: Array<[string, string]> = [
  ['documentPreflight', 'Document preflight'],
  ['executionTruth', 'Execution truth'],
  ['ronReadiness', 'RON readiness'],
  ['providerCapabilities', 'Provider capability'],
  ['destinationIntelligence', 'Destination'],
  ['documentClassification', 'Document classification'],
  ['authorityRoute', 'Authority route'],
  ['authorityEvidence', 'Authority evidence'],
  ['receivingAuthority', 'Receiving authority'],
  ['authorityPacket', 'Authority packet'],
  ['processingAdvisory', 'Processing advisory'],
  ['authorityLogistics', 'Authority logistics'],
  ['activeExceptions', 'Active exceptions'],
];

// Unified Matter execution intelligence — one internal, read-only projection.
export async function MatterExecutionIntelligencePanel({ matterId }: { matterId: string }) {
  const loaded = await loadMatterExecutionIntelligence(matterId);
  if (!loaded) return null;
  const intel = loaded.intelligence;
  const sections = intel as unknown as Record<string, { status: SectionStatus; summary: string }>;

  return (
    <section className="rounded-2xl border border-[#C6A65B]/20 bg-[#0A0A0A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C6A65B]">Execution Intelligence</p>
          <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">Unified Matter status</h2>
        </div>
        <span className={`rounded-full border border-current px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${TONE[intel.status]}`}>
          {intel.status.replaceAll('_', ' ')}
        </span>
      </div>
      <ul className="mt-4 space-y-1.5 text-xs">
        {LABELS.map(([key, label]) => (
          <li key={key} className="flex flex-col gap-0.5 border-b border-white/[0.05] pb-1.5 sm:flex-row sm:justify-between sm:gap-4">
            <span className="text-white/45">{label}</span>
            <span className="text-[#F6F1E6]/80 sm:text-right">
              <span className={`mr-2 font-mono text-[9px] uppercase ${TONE[sections[key].status]}`}>{sections[key].status.replaceAll('_', ' ')}</span>
              {sections[key].summary}
            </span>
          </li>
        ))}
      </ul>
      {intel.recommendedOperatorActions.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">Recommended operator actions</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-[#F6F1E6]/80">
            {intel.recommendedOperatorActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </div>
      )}
      <MatterExecutionBriefButton matterId={intel.matterId} />
    </section>
  );
}
