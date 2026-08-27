import Link from "next/link";
import { deriveClientReturnProjection, type CompletedMatterHistory } from "@/lib/intelligence/controlCenter";
import { readAllDealsForProjection } from "@/lib/matter/readAllDealsForProjection";

type DealRow = Record<string, unknown> & {
  id?: string;
  deal_id?: string;
  client_id?: string;
  client_email?: string;
  email?: string;
  client_name?: string;
  full_name?: string;
  completed_at?: string;
  destination_country?: string;
  country?: string;
  document_type?: string;
  document?: string;
  service_type?: string;
  referral_source?: string;
  status?: string;
  deal_status?: string;
};

type ReturnProjection = ReturnType<typeof deriveClientReturnProjection> & { label: string };

function stringOrNull(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

export async function ClientReturnIntelligence() {
  let rows: DealRow[] = [];
  let error: string | null = null;

  try {
    rows = await readAllDealsForProjection<DealRow>();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unable to load client return context.";
  }

  const groups = new Map<string, { label: string; history: CompletedMatterHistory[] }>();

  for (const row of rows) {
    const clientId = String(row.client_id ?? row.client_email ?? row.email ?? "").trim().toLowerCase();
    if (!clientId) continue;

    const bucket = groups.get(clientId) ?? {
      label: stringOrNull(row.client_name, row.full_name, row.client_email, row.email) ?? clientId,
      history: [],
    };

    const status = String(row.status ?? row.deal_status ?? "").toLowerCase();
    bucket.history.push({
      matterId: String(row.id ?? row.deal_id ?? "unknown"),
      completedAt: stringOrNull(row.completed_at),
      destinationCountry: stringOrNull(row.destination_country, row.country),
      documentCategory: stringOrNull(row.document_type, row.document, row.service_type),
      referralSource: stringOrNull(row.referral_source),
      open: !row.completed_at && !["completed", "closed"].includes(status),
    });
    groups.set(clientId, bucket);
  }

  const projections: ReturnProjection[] = [...groups.entries()]
    .map(([clientId, value]) => ({ label: value.label, ...deriveClientReturnProjection(clientId, value.history) }))
    .filter((item) => item.eligibleReturnContext)
    .sort((a, b) => (b.lastCompletedAt ?? "").localeCompare(a.lastCompletedAt ?? ""));

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-5 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--ms-gold)]">Growth · Client Return</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Completed-Matter return intelligence</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/50">Derived only from completed canonical Matter evidence across the full Matter set. This does not auto-contact clients, infer demand, fabricate lifetime value, or bypass a new canonical intake.</p>
        </div>
        <Link href="/intake" className="rounded-full border border-[var(--ms-gold)]/30 px-4 py-2 text-xs font-semibold text-[var(--ms-gold)]">Start governed Matter intake →</Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/35">
        <span>{rows.length} canonical Matters scanned server-side</span>
        <span>·</span>
        <span>{projections.length} eligible return contexts</span>
      </div>

      {error ? <div className="mt-4 text-sm text-red-200">{error}</div> : null}

      {!error ? <div className="mt-5 grid gap-3 xl:grid-cols-2">{projections.slice(0, 50).map((item) => <article key={item.clientId} className="rounded-2xl border border-white/8 bg-black/25 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="font-medium text-white">{item.label}</div><div className="text-xs text-[var(--ms-gold)]">{item.completedMatterCount} completed</div></div><div className="mt-3 grid gap-1 text-xs text-white/40"><div>Last completed: {item.lastCompletedAt ?? "—"}</div><div>Destinations: {item.previousDestinationCountries.join(", ") || "—"}</div><div>Documents: {item.documentCategories.join(", ") || "—"}</div><div>Prior governed source: {item.priorReferralSources.join(", ") || "—"}</div><div>Open Matter: {item.hasOpenMatter ? "YES" : "NO"}</div></div></article>)}</div> : null}

      {!error && projections.length > 50 ? <div className="mt-4 text-xs text-white/35">Showing the 50 most recent eligible return contexts; counts and projection eligibility are computed from the complete paginated Matter set.</div> : null}
      {!error && projections.length === 0 ? <div className="mt-5 rounded-xl border border-white/8 bg-black/25 p-4 text-sm text-white/35">No completed-Matter return context is currently available from canonical Matter evidence.</div> : null}
    </section>
  );
}
