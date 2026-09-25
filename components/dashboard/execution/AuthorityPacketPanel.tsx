import { loadAuthorityPacket } from '@/lib/intelligence/execution-brain/authorityPacketServer';
import { AuthorityPacketActions } from '@/components/dashboard/execution/AuthorityPacketActions';

const RESULT_CLASS: Record<string, string> = {
  PASS: 'text-[#C6A65B]',
  REVIEW_REQUIRED: 'text-amber-200',
  BLOCKED: 'text-[#E0876E]',
  NOT_APPLICABLE: 'text-white/35',
};

// Operator packet manifest around the registered official form. Internal only:
// it never modifies an official form, invents a fee or address, or asserts
// legal sufficiency or authority acceptance.
export async function AuthorityPacketPanel({ matterId }: { matterId: string }) {
  const loaded = await loadAuthorityPacket(matterId);
  if (!loaded) return null;
  const packet = loaded.manifest;
  const check = (key: string) => packet.checks.find((item) => item.key === key);

  const sections: Array<[string, string, string | undefined]> = [
    [
      'Official Form',
      packet.official_form_asset
        ? `${packet.official_form_asset.title} · v${packet.official_form_asset.source_version ?? '?'} · ${packet.official_form_asset.resolution.replaceAll('_', ' ').toLowerCase()}`
        : 'Not registered',
      check('official_form_current')?.result,
    ],
    [
      'Source Documents',
      packet.source_documents.length
        ? packet.source_documents.map((doc) => `${doc.label} (${doc.status.replaceAll('_', ' ').toLowerCase()})`).join(', ')
        : 'None on file',
      check('document_preflight_passed')?.result === 'PASS' ? check('source_document_present')?.result : check('document_preflight_passed')?.result,
    ],
    [
      'Paper-Out',
      packet.paper_out_evidence.required ? packet.paper_out_evidence.status.replaceAll('_', ' ').toLowerCase() : 'not required',
      check('paper_out_complete')?.result,
    ],
    [
      'Government Fee',
      packet.authority_fee.amount === null
        ? 'Unknown — no verified source'
        : `$${packet.authority_fee.amount.toFixed(2)} pass-through · method ${packet.payment_method_status.replace('_', ' ')}`,
      check('government_fee_known')?.result === 'PASS' ? check('government_fee_method_ready')?.result : check('government_fee_known')?.result,
    ],
    [
      'Return Envelope',
      packet.return_shipping_required === null ? 'Unresolved' : packet.return_shipping_required ? 'Required' : 'Not required',
      check('return_shipment_resolved')?.result,
    ],
    [
      'QA',
      packet.operator_qa.complete ? `Approved ${packet.operator_qa.approved_at?.slice(0, 10) ?? ''}` : 'Not recorded',
      check('operator_qa_complete')?.result,
    ],
  ];

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C6A65B]">Authority Packet</p>
          <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">Packet manifest</h2>
        </div>
        <span className="rounded-full border border-[#C6A65B]/35 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#C6A65B]">
          {packet.packet_status.replaceAll('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-xs text-white/45">
        Internal operator manifest. Final acceptance remains subject to the receiving authority.
      </p>

      <dl className="mt-4 space-y-2 text-xs">
        {sections.map(([label, value, result]) => (
          <div key={label} className="flex flex-col gap-1 border-b border-white/[0.05] pb-2 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-white/40">{label}</dt>
            <dd className="text-[#F6F1E6]/80 sm:text-right">
              {value}
              {result && (
                <span className={`ml-2 font-mono text-[9px] uppercase ${RESULT_CLASS[result] ?? 'text-white/40'}`}>
                  {result.replaceAll('_', ' ')}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {packet.missing_items.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">Missing Items</p>
          <ul className="mt-2 space-y-1 text-xs text-white/60">
            {packet.missing_items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      <AuthorityPacketActions
        matterId={loaded.matter.id}
        status={packet.packet_status}
        initial={{
          route_type: packet.route_type ?? 'florida_dos_apostille',
          document_count: packet.document_count ? String(packet.document_count) : '',
          destination_confirmed: packet.checks.find((c) => c.key === 'destination_confirmed')?.result === 'PASS',
          government_fee_method_status: packet.payment_method_status,
          return_shipping:
            packet.return_shipping_required === null ? 'unknown' : packet.return_shipping_required ? 'required' : 'not_required',
        }}
      />
    </section>
  );
}
