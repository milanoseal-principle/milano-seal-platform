import type { ReactNode } from 'react';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { createAdminClient } from '@/lib/supabase/admin';

function ageDays(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.floor((Date.now() - time) / 86400000) : Number.POSITIVE_INFINITY;
}

export default async function AuthorityVerifyLayout({ children }: { children: ReactNode }) {
  await requireDashboardAccess();
  const admin = createAdminClient();
  const { data } = await admin.from('receiving_authorities')
    .select('id, country, name, source_confidence, last_verified_at, notes')
    .order('country', { ascending: true });
  const rows = data ?? [];
  const stale = rows.filter((row) => ageDays(row.last_verified_at) > 365);
  const reviewDue = rows.filter((row) => ageDays(row.last_verified_at) > 180 && ageDays(row.last_verified_at) <= 365);
  const sourceConflicts = rows.filter((row) => /conflict/i.test(String(row.source_confidence ?? '')) || /source conflict/i.test(String(row.notes ?? '')));
  const pendingConvention = rows.filter((row) => /pending/i.test(String(row.source_confidence ?? '')) || /convention change|entry into force|pending convention/i.test(String(row.notes ?? '')));
  return <div className="space-y-6">
    <section className="grid gap-3 md:grid-cols-4">
      {[
        ['STALE ROUTES',stale.length,'>365 days'],
        ['REVIEW-DUE ROUTES',reviewDue.length,'181–365 days'],
        ['PENDING CONVENTION CHANGES',pendingConvention.length,'governed evidence only'],
        ['SOURCE CONFLICTS',sourceConflicts.length,'fail closed'],
      ].map(([label,value,note]) => <div key={String(label)} className="rounded-xl border border-[#C6A55A]/15 bg-[#080808] p-4"><p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#C6A55A]/55">{label}</p><p className="mt-2 text-2xl text-white/85">{value}</p><p className="mt-1 text-[10px] text-white/30">{note}</p></div>)}
    </section>
    <section className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#080808]">
      <table className="min-w-full text-left text-[11px]"><thead className="border-b border-white/[0.06] text-white/30"><tr><th className="p-3">COUNTRY</th><th className="p-3">AUTHORITY</th><th className="p-3">LAST VERIFIED</th><th className="p-3">REVIEW DUE</th><th className="p-3">STATUS</th></tr></thead><tbody>{rows.map((row) => {
        const age = ageDays(row.last_verified_at);
        const status = !Number.isFinite(age) || age > 365 ? 'STALE' : age > 180 ? 'REVIEW REQUIRED' : /conflict/i.test(String(row.source_confidence ?? '')) ? 'SOURCE CONFLICT' : 'VERIFIED';
        const reviewDueAt = row.last_verified_at ? new Date(new Date(row.last_verified_at).getTime() + 180 * 86400000).toISOString().slice(0,10) : 'Not established';
        return <tr key={row.id} className="border-b border-white/[0.04]"><td className="p-3 text-white/65">{row.country}</td><td className="p-3 text-white/55">{row.name}</td><td className="p-3 text-white/40">{row.last_verified_at ? row.last_verified_at.slice(0,10) : 'Not recorded'}</td><td className="p-3 text-white/40">{reviewDueAt}</td><td className="p-3 text-[#E4CA8C]">{status}</td></tr>;
      })}</tbody></table>
    </section>
    {children}
  </div>;
}
