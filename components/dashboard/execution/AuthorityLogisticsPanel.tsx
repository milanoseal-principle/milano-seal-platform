import { loadLogisticsContext } from '@/lib/intelligence/execution-brain/authorityLogisticsServer';
import { operatorShipmentLegProjection } from '@/lib/intelligence/execution-brain/authorityLogistics';
import { AuthorityLogisticsActions } from '@/components/dashboard/execution/AuthorityLogisticsActions';

const label = (value: string | null | undefined) => (value ? value.replaceAll('_', ' ').toLowerCase() : '—');
const place = (address: Record<string, unknown>) =>
  [address.name, address.city, address.state, address.country].filter((part) => typeof part === 'string' && part).join(', ') || '—';
const when = (value: string | null) => (value ? value.slice(0, 16).replace('T', ' ') : null);

// AUTHORITY LOGISTICS — operator-only view of Matter-linked shipment legs.
// Logistics evidence only: a delivered leg never completes the Matter.
export async function AuthorityLogisticsPanel({ matterId }: { matterId: string }) {
  const context = await loadLogisticsContext(matterId);
  if (!context) return null;
  const legs = context.legs.map(operatorShipmentLegProjection);
  const returnRequired = context.packet?.returnShippingRequired === true;
  const hasReturnLeg = legs.some((leg) => leg.leg_type === 'return_from_authority' && leg.custody_status !== 'exception');

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#C6A65B]">Authority Logistics</p>
          <h2 className="mt-1 font-serif text-xl text-[#F6F1E6]">Shipment legs</h2>
        </div>
        <span className="rounded-full border border-[#C6A65B]/35 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#C6A65B]">
          Packet · {label(context.packet?.packetStatus ?? 'not built')}
        </span>
      </div>
      <p className="mt-2 text-xs text-white/45">
        Logistics evidence only. Matter completion remains a separately governed operator action.
      </p>
      {returnRequired && !hasReturnLeg && (
        <p className="mt-3 rounded-lg border border-[#C6A65B]/30 bg-[#C6A65B]/[0.05] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#C6A65B]">
          Return label required
        </p>
      )}

      {legs.length === 0 ? (
        <p className="mt-4 text-xs text-white/45">No shipment legs yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {legs.map((leg) => {
            const trackingUrl = (leg.provider_evidence.label as { tracking_url_provider?: string } | undefined)?.tracking_url_provider;
            return (
              <li key={leg.id} className="rounded-xl border border-white/[0.06] bg-black/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-[#F6F1E6]">
                    <span className="font-mono text-[#C6A65B]">{leg.sequence}</span> · {label(leg.leg_type)}
                  </p>
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/50">
                    label {label(leg.label_status)} · custody {label(leg.custody_status)}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-2">
                  {([
                    ['Origin', place(leg.origin_json)],
                    ['Destination', place(leg.destination_json)],
                    ['Carrier', leg.carrier ?? '—'],
                    ['Service', leg.service_level ?? '—'],
                    ['Tracking', leg.tracking_number ?? '—'],
                    ['Tracking status', label(leg.tracking_status)],
                    ['Label created', when(leg.label_created_at) ?? '—'],
                    ['Shipped', when(leg.shipped_at) ?? '—'],
                    ['Delivered', when(leg.delivered_at) ?? '—'],
                    ['Leg complete', leg.completion.legComplete ? 'yes' : 'no'],
                  ] as const).map(([name, value]) => (
                    <div key={name} className="flex justify-between gap-3 border-b border-white/[0.04] pb-1">
                      <dt className="text-white/40">{name}</dt>
                      <dd className="break-words text-right text-[#F6F1E6]/80">{value}</dd>
                    </div>
                  ))}
                </dl>
                <AuthorityLogisticsActions
                  matterId={context.matter.id}
                  mode="leg"
                  leg={{
                    id: leg.id,
                    legType: leg.leg_type,
                    labelStatus: leg.label_status,
                    custodyStatus: leg.custody_status,
                    shipped: Boolean(leg.shipped_at),
                    labelAvailable: leg.label_available,
                    trackingUrl: trackingUrl ?? null,
                  }}
                />
              </li>
            );
          })}
        </ol>
      )}

      <AuthorityLogisticsActions
        matterId={context.matter.id}
        mode="create"
        create={{
          canCreateOutbound:
            context.packet?.packetStatus === 'READY_FOR_DISPATCH' &&
            !legs.some((leg) => leg.leg_type === 'outbound_to_authority' && leg.custody_status !== 'exception'),
          canCreateReturn: returnRequired && !hasReturnLeg,
        }}
      />
    </section>
  );
}
