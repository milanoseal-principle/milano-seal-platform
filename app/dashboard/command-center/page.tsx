import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  getPublicQuoteFactors,
  getServiceComponents,
} from "@/lib/command-center/pricingIntelligence";
import { getHighPriorityBundles } from "@/lib/command-center/dealLogic";
import {
  authorityPageTargets,
  getPublicAuthorityProfiles,
} from "@/lib/command-center/seoSocial";
import { MASTER_STATUS, REVENUE_STATUS } from "@/lib/command-center/status";
import { getCommandCenterWorkbookProjection } from "@/lib/command-center/workbookIntelligence";
import { getCommandCenterLiveMetrics } from "@/lib/command-center/liveMetrics";
import { WorkbookIntelligencePanel } from "@/components/dashboard/WorkbookIntelligencePanel";

export const metadata: Metadata = {
  title: "Command Center — The Milano Seal™",
  robots: { index: false, follow: false },
};

const complianceCards = [
  "Notary Commission Status",
  "DBA Status",
  "Annual Report Due",
  "Entity Status",
  "Items Expiring <90 Days",
];
const sections = [
  "Revenue",
  "Pipeline",
  "Execution",
  "Compliance",
  "Outreach",
  "Ads",
  "Content",
  "System",
];

const workspaces = [
  {
    href: "/dashboard/deals",
    label: "Matter Pipeline",
    note: "Open live Matters and payment state.",
  },
  {
    href: "/dashboard/dispatch",
    label: "Dispatch",
    note: "Route work and open Alliance dispatch actions.",
  },
  {
    href: "/dashboard/compliance-atlas",
    label: "Compliance",
    note: "Review jurisdiction and execution requirements.",
  },
  {
    href: "/dashboard/discounts",
    label: "Payments",
    note: "Open governed payment and courtesy controls.",
  },
  {
    href: "/dashboard/acquisition",
    label: "Acquisition",
    note: "Open lead and referral operating surfaces.",
  },
  {
    href: "/dashboard/operator-spine",
    label: "Intelligence",
    note: "Open operator intelligence and system controls.",
  },
] as const;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function MetricShell({
  label,
  value = "No live data connected yet",
  note = "Connect live matter records to populate this card.",
}: {
  label: string;
  value?: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-300/20 bg-black/40 p-4 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
      <p className="text-xs uppercase tracking-[0.24em] text-amber-200/60">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-amber-100">{value}</p>
      <p className="mt-2 text-sm leading-6 text-stone-300">{note}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-amber-300/15 bg-stone-950/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-amber-100">{title}</h2>
        <span className="rounded-full border border-amber-300/20 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-amber-200/70">
          Internal
        </span>
      </div>
      {children}
    </section>
  );
}

export default async function CommandCenterPage() {
  const bundles = getHighPriorityBundles();
  const factors = getPublicQuoteFactors();
  const serviceComponents = getServiceComponents();
  const profiles = getPublicAuthorityProfiles();
  const workbookProjection = getCommandCenterWorkbookProjection();
  const live = await getCommandCenterLiveMetrics();
  const hasLive = live.source === "supabase";

  const revenueCards = [
    ["Total Collected", hasLive ? usd.format(live.totalCollected) : undefined],
    ["Total Outstanding", hasLive ? usd.format(live.totalOutstanding) : undefined],
    ["YTD Revenue", hasLive ? usd.format(live.ytdRevenue) : undefined],
    ["Average Deal Value", hasLive ? usd.format(live.averageDealValue) : undefined],
    ["Highest Value Deal", hasLive ? usd.format(live.highestValueDeal) : undefined],
    ["Italy Lane Revenue", hasLive ? usd.format(live.italyLaneRevenue) : undefined],
  ] as const;

  const pipelineCards = [
    ["Total Deals", hasLive ? String(live.totalDeals) : undefined],
    ["Active", hasLive ? String(live.active) : undefined],
    ["Awaiting Payment", hasLive ? String(live.awaitingPayment) : undefined],
    ["Scheduled", hasLive ? String(live.scheduled) : undefined],
    ["In Execution", hasLive ? String(live.inExecution) : undefined],
    ["Apostille Processing", hasLive ? String(live.apostilleProcessing) : undefined],
  ] as const;

  const executionCards = [
    ["Completed Deals", hasLive ? String(live.completedDeals) : undefined],
    ["High Risk Deals", hasLive&&live.highRiskDeals!==null ? String(live.highRiskDeals) : undefined],
  ] as const;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="overflow-hidden rounded-[2.5rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.22),transparent_34%),linear-gradient(135deg,#050505,#14100a_48%,#050505)] p-8 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.36em] text-amber-200/70">
            Internal Operator Dashboard
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.03em] text-white md:text-6xl">
                Command Center
              </h1>
              <p className="mt-3 max-w-3xl text-xl text-amber-100/85">
                Every Matter. Every Dollar. Every Step.
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-stone-300">
                Live Supabase Matter metrics are separated from workbook evidence.
                Workbook history never creates verified revenue, payment truth, or
                execution authority.
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-300/25 bg-emerald-950/20 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-200/80">
                Payment Gate Status
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-100">
                ENFORCED
              </p>
              <p className="mt-3 text-sm leading-6 text-emerald-50/75">
                Payment provider: Wise only. Scheduling remains payment-gated.
              </p>
            </div>
          </div>
        </header>

        <WorkbookIntelligencePanel projection={workbookProjection} />

        <nav className="flex flex-wrap gap-2" aria-label="Command Center sections">
          {sections.map((section) => (
            <a
              key={section}
              href={`#${section.toLowerCase()}`}
              className="rounded-full border border-amber-300/20 bg-amber-200/5 px-4 py-2 text-xs uppercase tracking-[0.18em] text-amber-100 hover:bg-amber-200/10"
            >
              {section}
            </a>
          ))}
        </nav>

        <section aria-label="Operator workspaces" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.href}
              href={workspace.href}
              className="group rounded-2xl border border-amber-300/15 bg-stone-950/80 p-4 transition hover:border-amber-300/35 hover:bg-amber-200/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-amber-100">{workspace.label}</p>
                <ArrowRight className="h-4 w-4 text-amber-200/45 transition group-hover:translate-x-0.5 group-hover:text-amber-200" />
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-400">{workspace.note}</p>
            </Link>
          ))}
        </section>

        <Section title="Revenue">
          <div id="revenue" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {revenueCards.map(([label, value]) => (
              <MetricShell
                key={label}
                label={label}
                value={value}
                note={
                  hasLive
                    ? "Canonical Supabase Matter records only."
                    : "No live Supabase revenue signal available."
                }
              />
            ))}
          </div>
        </Section>

        <Section title="Pipeline">
          <div id="pipeline" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pipelineCards.map(([label, value]) => (
              <MetricShell
                key={label}
                label={label}
                value={value}
                note={
                  hasLive
                    ? "Canonical Supabase Matter state."
                    : "No live Supabase pipeline signal available."
                }
              />
            ))}
          </div>
        </Section>

        <Section title="Execution">
          <div id="execution" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {executionCards.map(([label, value]) => (
              <MetricShell
                key={label}
                label={label}
                value={value}
                note={
                  hasLive
                    ? "Canonical Supabase execution state."
                    : "No live Supabase execution signal available."
                }
              />
            ))}
            <MetricShell
              label="Avg Turnaround Days"
              value="No live calculation connected"
              note="Controlled empty state; no inferred turnaround metric."
            />
            <MetricShell
              label="Stuck >48H Flags"
              value="No live calculation connected"
              note="Controlled empty state; no fabricated exception count."
            />
          </div>
        </Section>

        <Section title="Compliance">
          <div id="compliance" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {complianceCards.map((card) => (
              <MetricShell
                key={card}
                label={card}
                value="Review"
                note="Operator-maintained compliance item; not a public claim."
              />
            ))}
          </div>
        </Section>

        <section id="outreach" className="grid gap-6 lg:grid-cols-2">
          <Section title="Outreach">
            <div className="space-y-3 text-sm text-stone-300">
              <p className="text-amber-100">
                Ready scripts and relationship templates are stored as typed internal modules.
              </p>
              <p>
                Use them for Instagram inbound, email intake confirmation, attorney introductions,
                and referral follow-up without exposing private operator workflow publicly.
              </p>
            </div>
          </Section>
          <Section title="Ads">
            <div className="grid gap-3 text-sm text-stone-300">
              {bundles.slice(0, 3).map((bundle) => (
                <div
                  key={bundle.name}
                  className="rounded-2xl border border-amber-300/10 bg-black/30 p-4"
                >
                  <p className="font-semibold text-amber-100">{bundle.name}</p>
                  <p className="mt-1">
                    Market: {bundle.market} · Priority: {bundle.priority}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </section>

        <section id="content" className="grid gap-6 lg:grid-cols-2">
          <Section title="Content">
            <div className="space-y-3">
              {authorityPageTargets.map((target) => (
                <div
                  key={target.legacyTarget}
                  className="rounded-2xl border border-amber-300/10 bg-black/30 p-4 text-sm text-stone-300"
                >
                  <p className="font-semibold text-amber-100">{target.intent}</p>
                  <p className="mt-1">
                    {target.legacyTarget} → {target.currentRoute}
                  </p>
                </div>
              ))}
            </div>
          </Section>
          <Section title="System">
            <div id="system" className="grid gap-4">
              <MetricShell
                label="Payment Gate Status"
                value="ENFORCED"
                note="Wise-only payment authority; scheduling remains gated."
              />
              <MetricShell
                label="Supabase Connection"
                value={hasLive ? "LIVE" : "No live health signal connected"}
                note={
                  hasLive
                    ? "Command Center metrics loaded from canonical Supabase Matter records."
                    : "Controlled empty state; no healthy status is inferred."
                }
              />
              <MetricShell
                label="AI Status"
                value="No live health signal connected"
                note="Controlled empty state; no generic Ready status."
              />
              <MetricShell
                label="Wise Integration"
                value="WISE ONLY"
                note="Canonical payment authority. Settlement health is not inferred here."
              />
            </div>
          </Section>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Section title="Pricing Intelligence">
            <ul className="space-y-2 text-sm text-stone-300">
              {factors.map((factor) => (
                <li key={factor}>• {factor}</li>
              ))}
            </ul>
          </Section>
          <Section title="Service Components">
            <ul className="space-y-2 text-sm text-stone-300">
              {serviceComponents.map((component) => (
                <li key={component}>• {component}</li>
              ))}
            </ul>
          </Section>
          <Section title="Authority Profiles">
            <ul className="space-y-2 text-sm text-stone-300">
              {profiles.map((profile) => (
                <li key={profile.label}>
                  • {profile.label}: {profile.value}
                </li>
              ))}
            </ul>
          </Section>
        </section>

        <section className="rounded-[2rem] border border-amber-300/15 bg-black/50 p-6">
          <h2 className="text-xl font-semibold text-amber-100">Workbook Controls Extracted</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200/60">
                Master Status
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-300">
                {MASTER_STATUS.join(" · ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200/60">
                Revenue Status
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-300">
                {REVENUE_STATUS.join(" · ")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
