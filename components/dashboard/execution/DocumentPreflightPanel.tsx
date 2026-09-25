import { createAdminClient } from '@/lib/supabase/admin';
import { evaluateExecutionDocumentReadiness } from '@/lib/intelligence/execution-brain/documentReadiness';

const TONE: Record<string, string> = {
  READY: 'text-[#C6A65B]',
  REVIEW_REQUIRED: 'text-amber-200',
  BLOCKED: 'text-[#E0876E]',
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const yesNo = (value: boolean | null | undefined, yes: string, no: string) => (value === true ? yes : value === false ? no : 'Not scanned');

// DOCUMENT PREFLIGHT — persisted structural evidence per execution document.
// Structural facts only: never a legal-sufficiency judgement.
export async function DocumentPreflightPanel({ matterId }: { matterId: string }) {
  const supabase = createAdminClient();
  const base = supabase.from('deals').select('id');
  const { data: matter } = UUID_RE.test(matterId)
    ? await base.or(`id.eq.${matterId},deal_id.eq.${matterId}`).maybeSingle()
    : await base.eq('deal_id', matterId).maybeSingle();
  if (!matter) return null;
  const { data: files } = await supabase
    .from('files')
    .select('id, name, filename, mime_type, file_type, structural_status, structural_review_reason, signature_detected, certification_signature_detected, encryption_detected, preflight_checked_at')
    .eq('deal_id', matter.id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true });
  const readiness = evaluateExecutionDocumentReadiness(files ?? []);
  const byId = new Map((files ?? []).map((file) => [file.id, file]));

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C6A65B]">Document Preflight</p>
          <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">Execution documents</h2>
        </div>
        <span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${readiness.ready ? TONE.READY : TONE.REVIEW_REQUIRED}`}>
          Execution Readiness · {readiness.ready ? 'ready' : readiness.candidates.length ? 'not ready' : 'no documents'}
        </span>
      </div>
      {readiness.candidates.length === 0 ? (
        <p className="mt-3 text-xs text-white/45">No execution document is on file.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {readiness.candidates.map((candidate) => {
            const file = byId.get(candidate.id)!;
            const status = file.structural_status ?? 'NOT_RUN';
            return (
              <li key={file.id} className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
                <p className="break-words text-sm text-[#F6F1E6]">{file.name ?? file.filename ?? 'Execution document'}</p>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-2">
                  {([
                    ['Structural Integrity', <span key="s" className={TONE[status] ?? 'text-white/50'}>{status.replaceAll('_', ' ').toLowerCase()}</span>],
                    ['Signature State', yesNo(file.signature_detected, 'Signature field present', 'No signature field')],
                    ['Certification Signature', yesNo(file.certification_signature_detected, 'Certification signature present', 'None')],
                    ['Encryption State', yesNo(file.encryption_detected, 'Encrypted', 'Not encrypted')],
                    ['Checked', file.preflight_checked_at ? String(file.preflight_checked_at).slice(0, 16).replace('T', ' ') : 'Not scanned'],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 border-b border-white/[0.04] pb-1">
                      <dt className="text-white/40">{label}</dt>
                      <dd className="text-right text-[#F6F1E6]/80">{value}</dd>
                    </div>
                  ))}
                </dl>
                {file.structural_review_reason && <p className="mt-2 text-[11px] text-amber-200/80">{file.structural_review_reason}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
