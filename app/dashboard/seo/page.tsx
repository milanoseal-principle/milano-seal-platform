export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { getSeoRevenueFeedback } from "@/lib/seo/search-console/reporting";
import { getSeoAuthorityActivationSnapshot } from "@/lib/seo/activation/repository";
import { SearchConsoleSyncControl } from "@/components/dashboard/SearchConsoleSyncControl";
import { SeoAuthorityActivationControl } from "@/components/dashboard/SeoAuthorityActivationControl";

export const metadata = {
  title: "SEO Authority Activation — Milano Seal",
  robots: { index: false, follow: false },
};

export default async function SEOPage() {
  await requireDashboardAccess();
  const report = await getSeoRevenueFeedback();
  const activation = await getSeoAuthorityActivationSnapshot(report.opportunities);

  return (
    <main className="mx-auto max-w-7xl p-6 text-white">
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-500">SEO Authority Engine · Activation Control Plane</p>
        <h1 className="mt-2 text-2xl font-semibold">International Organic Acquisition</h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
          Verified Google Search Console demand, governed localization status, private professional-authority evidence, and canonical Wise-paid Matter revenue are operated as separate truth lanes. The system prioritizes work without inventing query-to-revenue attribution, backlinks, partnerships, or acceptance certainty.
        </p>
      </div>

      {!report.configured && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-200">
          SEARCH CONSOLE UNCONFIGURED — set GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON and GOOGLE_SEARCH_CONSOLE_SITE_URL. Until then, traffic and ranking metrics remain empty.
        </div>
      )}

      <SearchConsoleSyncControl configured={report.configured} />

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["GSC observations", report.observations],
          ["Paid Matters", report.paidMatters],
          ["Verified Wise-paid revenue", `$${report.verifiedRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`],
          ["Observation window", `${report.windowDays} days`],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-white/10 bg-zinc-950 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Verified Search Demand</p>
        <h2 className="mb-3 mt-1 text-lg font-semibold">Search Console opportunities</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-zinc-500">
              <tr><th className="p-3">Query</th><th className="p-3">Page</th><th className="p-3">Impressions</th><th className="p-3">Clicks</th><th className="p-3">CTR</th><th className="p-3">Position</th><th className="p-3">Priority</th></tr>
            </thead>
            <tbody>
              {report.opportunities.map((row) => (
                <tr key={`${row.query}-${row.page}`} className="border-t border-white/5">
                  <td className="p-3 text-zinc-200">{row.query}</td>
                  <td className="max-w-xs truncate p-3 text-zinc-500">{row.page}</td>
                  <td className="p-3">{row.impressions.toLocaleString()}</td>
                  <td className="p-3">{row.clicks.toLocaleString()}</td>
                  <td className="p-3">{(row.ctr * 100).toFixed(1)}%</td>
                  <td className="p-3">{row.position.toFixed(1)}</td>
                  <td className="p-3 text-amber-300">{row.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.opportunities.length === 0 && <p className="mt-3 text-sm text-zinc-500">No verified Search Console observations are available yet.</p>}
      </section>

      <SeoAuthorityActivationControl
        provisioned={activation.provisioned}
        provisioningMessage={activation.provisioningMessage}
        relationships={activation.relationships}
        placements={activation.placements}
        actions={activation.actions}
        derivedCandidates={activation.derivedCandidates}
        pendingLocalizedRoutes={activation.pendingLocalizedRoutes}
        verifiedPlacementCount={activation.verifiedPlacementCount}
        stalePlacementCount={activation.stalePlacementCount}
      />

      <div className="mt-10 space-y-2 border-t border-white/5 pt-5 text-xs text-zinc-600">
        <p>{report.attributionBoundary}</p>
        <p>{activation.attributionBoundary}</p>
      </div>
    </main>
  );
}
