import { createAdminClient } from '@/lib/supabase/admin';
import { readPaperOutChecklist } from '@/lib/intelligence/execution-brain/paperOut';
import {
  AUTHORITY_ASSET_FIELDS,
  FLORIDA_DOS_APOSTILLE_FORM,
  FLORIDA_SUBMISSION_NOTICE,
  STATE_AUTHORITY_FIELDS,
  evaluateStateAuthority,
  resolveOfficialAsset,
  type AuthoritySourceAsset,
  type StateAuthorityRecord,
} from '@/lib/intelligence/execution-brain/stateAuthorityProvenance';
import { PaperOutChecklistActions } from '@/components/ron/PaperOutChecklistActions';

// Florida paper-out control for electronically executed Matters. Operator
// evidence only: the checklist never asserts Florida DOS acceptance.
export async function PaperOutChecklistPanel({ matterId }: { matterId: string }) {
  const supabase = createAdminClient();
  const { data: matter } = await supabase
    .from('deals')
    .select('id, execution_truth')
    .eq('id', matterId)
    .maybeSingle();
  if (!matter) return null;
  const truth = (matter.execution_truth ?? {}) as Record<string, unknown>;
  if (truth.execution_method !== 'ron') return null;

  const [{ data: authority }, { data: assets }] = await Promise.all([
    supabase
      .from('state_authorities')
      .select(STATE_AUTHORITY_FIELDS)
      .eq('state_code', FLORIDA_DOS_APOSTILLE_FORM.stateCode)
      .eq('authority_name', FLORIDA_DOS_APOSTILLE_FORM.authorityName)
      .maybeSingle(),
    supabase
      .from('authority_source_assets')
      .select(AUTHORITY_ASSET_FIELDS)
      .eq('state_code', FLORIDA_DOS_APOSTILLE_FORM.stateCode),
  ]);

  const evaluation = authority ? evaluateStateAuthority(authority as unknown as StateAuthorityRecord) : null;
  const form = resolveOfficialAsset((assets ?? []) as AuthoritySourceAsset[], {
    stateCode: FLORIDA_DOS_APOSTILLE_FORM.stateCode,
    purpose: FLORIDA_DOS_APOSTILLE_FORM.purpose,
  });
  const checklist = readPaperOutChecklist(matter.execution_truth);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C6A65B]">Florida Paper-Out Control</p>
          <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">Paper-out checklist</h2>
        </div>
        <span className="rounded-full border border-[#C6A65B]/35 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#C6A65B]">
          {checklist.status.replaceAll('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-xs text-amber-200/80">{FLORIDA_SUBMISSION_NOTICE}</p>

      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
        {([
          ['State authority', authority ? String((authority as { authority_name?: string }).authority_name) : 'Not registered'],
          ['Authority provenance', evaluation?.status.replaceAll('_', ' ') ?? 'INSUFFICIENT EVIDENCE'],
          ['Official form', form.asset ? `${form.asset.title} (${form.asset.source_version ?? 'version not recorded'})` : 'Not registered'],
          ['Official form status', form.status.replaceAll('_', ' ')],
        ] as const).map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 border-b border-white/[0.05] pb-1.5">
            <dt className="text-white/40">{label}</dt>
            <dd className="text-right text-[#F6F1E6]/80">{value}</dd>
          </div>
        ))}
      </dl>
      {[...(evaluation?.reasons ?? []), ...form.reasons].length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-white/55">
          {[...(evaluation?.reasons ?? []), ...form.reasons].map((reason) => (
            <li key={reason}>• {reason}</li>
          ))}
        </ul>
      )}

      {checklist.status !== 'NOT_GENERATED' && (
        <ul className="mt-4 space-y-1.5 text-xs">
          {checklist.items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 border-b border-white/[0.05] pb-1.5">
              <span className="text-[#F6F1E6]/80">{item.label}</span>
              <span className={item.status === 'pending' ? 'text-white/40' : 'text-[#C6A65B]'}>
                {item.status.replaceAll('_', ' ')}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[#F6F1E6]/80">Operator approval recorded</span>
            <span className={checklist.operatorApprovedAt ? 'text-[#C6A65B]' : 'text-white/40'}>
              {checklist.operatorApprovedAt ? 'approved' : 'pending'}
            </span>
          </li>
        </ul>
      )}

      <PaperOutChecklistActions
        matterId={matter.id}
        status={checklist.status}
        pending={checklist.items.filter((item) => item.status === 'pending').map(({ key, label, optional }) => ({ key, label, optional }))}
      />
    </section>
  );
}
