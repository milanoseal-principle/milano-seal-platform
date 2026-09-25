import { loadAuthorityPacket } from '@/lib/intelligence/execution-brain/authorityPacketServer';
import { AuthorityPacketActions } from '@/components/dashboard/execution/AuthorityPacketActions';

const label = (value: string) => value.replaceAll('_', ' ').toLowerCase();

// AUTHORITY PACKET — operator-only projection over canonical Matter truth and
// the registered official form. It never modifies an official form, invents a
// fee or address, or asserts legal sufficiency or authority acceptance.
export async function AuthorityPacketPanel({ matterId }: { matterId: string }) {
  const loaded = await loadAuthorityPacket(matterId);
  if (!loaded) return null;
  const packet = loaded.projection;
  const form = packet.officialFormAsset;

  const rows: Array<[string, string]> = [
    ['Authority', packet.authorityId ? (packet.checks.find((c) => c.key === 'authority_resolved')?.detail ?? '') : 'Not resolved'],
    ['Route', packet.routeType ? label(packet.routeType) : 'Not resolved'],
    ['Official Form', form ? `${form.title} · v${form.sourceVersion ?? '?'}` : 'Not registered'],
    ['Official Form Status', form ? label(form.resolution) : packet.checks.find((c) => c.key === 'official_form_current')?.detail ?? 'missing'],
    [
      'Documents',
      packet.sourceDocuments.length
        ? packet.sourceDocuments.map((doc) => `${doc.filename} (${label(doc.packet_role)} · ${label(doc.preflight_status)} · ${label(doc.execution_status)})`).join(', ')
        : 'None on file',
    ],
    ['Document Count', packet.documentCount === null ? 'Not recorded' : String(packet.documentCount)],
    ['Paper-Out', `${label(packet.paperOutEvidence.applicability)} · ${packet.paperOutEvidence.applicability === 'REQUIRED' ? label(packet.paperOutEvidence.status) : packet.paperOutEvidence.basis}`],
    ['Government Fee', packet.authorityFee === null ? 'Unknown' : `$${packet.authorityFee.toFixed(2)} ${packet.authorityFeeCurrency} · pass-through`],
    ['Government Fee Source', label(packet.authorityFeeSourceStatus)],
    ['Government Fee Payment Method', label(packet.paymentMethodStatus)],
    ['Outbound Shipment', packet.outboundShippingRequired === null ? 'Unresolved' : 'Required'],
    ['Return Shipment', label(packet.returnShipmentMode)],
    ['Operator QA', packet.operatorQa.complete ? `Complete ${packet.operatorQa.approved_at?.slice(0, 10) ?? ''}` : 'Not complete'],
  ];

  const lists: Array<[string, string[], string]> = [
    ['Blockers', packet.blockers, 'text-[#E0876E]'],
    ['Review Reasons', packet.reviewReasons, 'text-amber-200/90'],
    ['Missing Items', packet.packetStatus === 'ASSEMBLED' ? packet.warnings : [], 'text-white/60'],
  ].filter(([, items]) => (items as string[]).length > 0) as Array<[string, string[], string]>;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C6A65B]">Authority Packet</p>
          <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">Packet Status</h2>
        </div>
        <span className="rounded-full border border-[#C6A65B]/35 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#C6A65B]">
          {packet.packetStatus.replaceAll('_', ' ')}
        </span>
      </div>
      <p className="mt-2 text-xs text-white/45">
        Internal operator manifest. Final acceptance remains subject to the receiving authority.
      </p>

      <dl className="mt-4 space-y-2 text-xs">
        {rows.map(([name, value]) => (
          <div key={name} className="flex flex-col gap-1 border-b border-white/[0.05] pb-2 sm:flex-row sm:justify-between sm:gap-4">
            <dt className="text-white/40">{name}</dt>
            <dd className="break-words text-[#F6F1E6]/80 sm:text-right">{value}</dd>
          </div>
        ))}
      </dl>

      {lists.map(([name, items, tone]) => (
        <div key={name} className="mt-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">{name}</p>
          <ul className={`mt-2 space-y-1 text-xs ${tone}`}>
            {items.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      ))}

      <AuthorityPacketActions
        matterId={loaded.matter.id}
        status={packet.packetStatus}
        qaComplete={packet.operatorQa.complete}
        initial={{
          route_type: packet.routeType ?? '',
          document_count: packet.documentCount ? String(packet.documentCount) : '',
          government_fee_payment_method: packet.paymentMethodStatus,
          return_shipment_mode: packet.returnShipmentMode,
        }}
      />
    </section>
  );
}
