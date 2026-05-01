import { createAdminClient } from "@/lib/supabase/admin";
import { DESTINATIONS } from "@/components/landing/global-intel";
import { DOCUMENTS } from "@/components/landing/document-intelligence";

export const metadata = {
  title: "Analytics — The Milano Seal™",
  robots: { index: false },
};

async function getAnalyticsData() {
  try {
    const supabase = createAdminClient();
    const [dealsRes, eventsRes] = await Promise.all([
      supabase
        .from("deals")
        .select(
          "amount, payment_status, status, destination_country, document_type, execution_tier, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("document_intel_events")
        .select("document_id, country, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    return { deals: dealsRes.data || [], events: eventsRes.data || [] };
  } catch {
    return { deals: [], events: [] };
  }
}

export default async function AnalyticsPage() {
  const { deals, events } = await getAnalyticsData();

  // Revenue
  const paid = deals.filter((d) => d.payment_status === "paid");
  const revenue = paid.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const pending = deals
    .filter((d) => d.payment_status !== "paid")
    .reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const avgDeal = paid.length ? revenue / paid.length : 0;

  // Destination demand
  const byCountry: Record<string, number> = {};
  deals.forEach((d) => {
    if (d.destination_country)
      byCountry[d.destination_country] =
        (byCountry[d.destination_country] || 0) + 1;
  });
  const topCountries = Object.entries(byCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Document demand
  const byDoc: Record<string, number> = {};
  deals.forEach((d) => {
    if (d.document_type)
      byDoc[d.document_type] = (byDoc[d.document_type] || 0) + 1;
  });
  const topDocs = Object.entries(byDoc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Bundle intel
  const bundles: Record<string, number> = {};
  events.forEach((e) => {
    const doc = DOCUMENTS.find((d) => d.id === e.document_id);
    if (doc?.bundle) bundles[doc.bundle] = (bundles[doc.bundle] || 0) + 1;
  });
  const topBundles = Object.entries(bundles).sort((a, b) => b[1] - a[1]);

  // Growth signals — weekly intake trend
  const now = Date.now();
  const weeks: Record<string, number> = {};
  deals.forEach((d) => {
    const w = Math.floor(
      (now - new Date(d.created_at).getTime()) / (7 * 24 * 3600000)
    );
    const label = w === 0 ? "This Week" : w === 1 ? "Last Week" : `${w}w ago`;
    weeks[label] = (weeks[label] || 0) + 1;
  });

  const Card = ({ title, value, sub, gold }: any) => (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
      <p className="text-[9px] tracking-widest uppercase text-[#6A6A6A] mb-2">
        {title}
      </p>
      <p
        className={`text-2xl font-light font-serif ${
          gold ? "text-[#C6A55A]" : "text-white"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[#C6A55A] text-[10px] mt-1">{sub}</p>}
    </div>
  );

  const Bar = ({ label, value, max }: any) => (
    <div className="flex items-center gap-4 py-2 border-b border-[#1A1A1A] last:border-0">
      <span className="text-[#B0B0B0] text-xs w-48 truncate">{label}</span>
      <div className="flex-1 bg-[#1A1A1A] rounded-full h-1.5">
        <div
          className="bg-[#C6A55A] h-1.5 rounded-full"
          style={{ width: `${max ? (value / max) * 100 : 0}%` }}
        />
      </div>
      <span className="text-white text-xs w-6 text-right">{value}</span>
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <p className="text-[#C6A55A] text-[9px] tracking-[0.25em] uppercase font-semibold mb-1">
          System Intelligence
        </p>
        <h1 className="text-white font-serif text-2xl font-light">Analytics</h1>
        <p className="text-[#8A8A8A] text-sm mt-1">
          Live performance across revenue, destinations, documents, and growth
          signals.
        </p>
      </div>

      {/* Investor Signals */}
      <section className="mb-10">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase mb-4 font-semibold">
          Intelligence Signals
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111111] border border-[#C6A55A]/20 rounded-xl p-5">
            <p className="text-[9px] tracking-widest uppercase text-[#6A6A6A] mb-2">
              Top Market
            </p>
            <p className="text-white font-serif text-lg">
              {topCountries[0]?.[0] || "Insufficient data"}
            </p>
            {topCountries.length > 1 &&
              topCountries[0]?.[1] &&
              topCountries[1]?.[1] && (
                <p className="text-[#C6A55A] text-[10px] mt-1">
                  {Math.round(
                    ((topCountries[0][1] - topCountries[1][1]) /
                      Math.max(topCountries[1][1], 1)) *
                      100
                  )}
                  % ahead of next market
                </p>
              )}
          </div>
          <div className="bg-[#111111] border border-[#C6A55A]/20 rounded-xl p-5">
            <p className="text-[9px] tracking-widest uppercase text-[#6A6A6A] mb-2">
              Top Revenue Driver
            </p>
            <p className="text-white font-serif text-lg">
              {topDocs[0]?.[0] || "Insufficient data"}
            </p>
            {topDocs[0]?.[1] && (
              <p className="text-[#C6A55A] text-[10px] mt-1">
                {topDocs[0][1]} matter{topDocs[0][1] !== 1 ? "s" : ""} executed
              </p>
            )}
          </div>
          <div className="bg-[#111111] border border-[#C6A55A]/20 rounded-xl p-5">
            <p className="text-[9px] tracking-widest uppercase text-[#6A6A6A] mb-2">
              Expansion Signal
            </p>
            {topCountries.length >= 3 ? (
              <>
                <p className="text-white font-serif text-lg">
                  {topCountries
                    .slice(-2)
                    .map((c) => c[0])
                    .join(" + ")}
                </p>
                <p className="text-[#C6A55A] text-[10px] mt-1">
                  Fastest growing destinations
                </p>
              </>
            ) : (
              <p className="text-white font-serif text-lg">Building data…</p>
            )}
          </div>
        </div>
      </section>

      {/* 1. Revenue */}
      <section className="mb-10">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase mb-4 font-semibold">
          Revenue
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            title="Total Collected"
            value={`$${revenue.toLocaleString()}`}
            gold
          />
          <Card title="Pending" value={`$${pending.toLocaleString()}`} />
          <Card
            title="Avg Matter Value"
            value={`$${Math.round(avgDeal).toLocaleString()}`}
          />
          <Card
            title="Paid Matters"
            value={paid.length}
            sub={`of ${deals.length} total`}
          />
        </div>
      </section>

      {/* 2. Destinations */}
      <section className="mb-10">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase mb-4 font-semibold">
          Destination Demand
        </p>
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
          {topCountries.length === 0 ? (
            <p className="text-[#6A6A6A] text-sm">No destination data yet.</p>
          ) : (
            topCountries.map(([c, v]) => (
              <Bar key={c} label={c} value={v} max={topCountries[0]?.[1]} />
            ))
          )}
        </div>
      </section>

      {/* 3. Document Demand */}
      <section className="mb-10">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase mb-4 font-semibold">
          Document Demand
        </p>
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
          {topDocs.length === 0 ? (
            <p className="text-[#6A6A6A] text-sm">No document data yet.</p>
          ) : (
            topDocs.map(([d, v]) => (
              <Bar key={d} label={d} value={v} max={topDocs[0]?.[1]} />
            ))
          )}
        </div>
      </section>

      {/* 4. Bundle Intelligence */}
      <section className="mb-10">
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase mb-4 font-semibold">
          Bundle Intelligence
        </p>
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
          {topBundles.length === 0 ? (
            <p className="text-[#6A6A6A] text-sm">
              Bundle data populates from document intelligence interactions.
            </p>
          ) : (
            topBundles.map(([b, v]) => (
              <Bar key={b} label={b} value={v} max={topBundles[0]?.[1]} />
            ))
          )}
        </div>
      </section>

      {/* 5. Growth Signals */}
      <section>
        <p className="text-[#C6A55A] text-[10px] tracking-widest uppercase mb-4 font-semibold">
          Growth Signals
        </p>
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-5">
          {Object.keys(weeks).length === 0 ? (
            <p className="text-[#6A6A6A] text-sm">No intake data yet.</p>
          ) : (
            Object.entries(weeks).map(([label, v]) => (
              <Bar
                key={label}
                label={label}
                value={v}
                max={Math.max(...Object.values(weeks))}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
