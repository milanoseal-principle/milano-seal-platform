export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { FounderCommandCenter } from "@/components/founder/FounderCommandCenter";
import { DailyRevenuePanel } from "@/components/founder/DailyRevenuePanel";
import { PendingQuotesPanel } from "@/components/founder/PendingQuotesPanel";
import { FounderFollowUps } from "@/components/founder/FounderFollowUps";
import { HighValueMatterQueue } from "@/components/founder/HighValueMatterQueue";
import { AttorneyPipeline } from "@/components/founder/AttorneyPipeline";
import { PartnerPipeline } from "@/components/founder/PartnerPipeline";
import { GovernmentOpportunityQueue } from "@/components/founder/GovernmentOpportunityQueue";
import { InternationalOpportunityQueue } from "@/components/founder/InternationalOpportunityQueue";
import { MarketingQueue } from "@/components/founder/MarketingQueue";
import { ContentQueue } from "@/components/founder/ContentQueue";
import { WeeklyKPIReview } from "@/components/founder/WeeklyKPIReview";
import { MonthlyRevenueReview } from "@/components/founder/MonthlyRevenueReview";
import { assembleDailyCommand } from "@/lib/founder-os/dailyCommand";
import type {
  FollowUpItem,
  PipelineItem,
  ContentQueueItem,
  MarketingTask,
  RevenueRecord,
  KpiSnapshot,
} from "@/lib/founder-os/types";

export const metadata = {
  title: "Founder Command — The Milano Seal™",
  robots: { index: false },
};

const TODAY = "2026-07-09";

// INTERNAL SAMPLE DATA — illustrative only, clearly labeled. Not real clients,
// leads, revenue, or projections presented as facts. All money is "sample" and
// carries dataKind so it is never shown as an actual figure.
const SAMPLE_FOLLOWUPS: FollowUpItem[] = [
  {
    id: "fu-1",
    label: "Sample attorney relationship — quarterly touch",
    channel: "attorney",
    lastContact: "2026-06-01",
    cadenceDays: 30,
    dataKind: "sample",
    value: 8000,
    note: "Illustrative record.",
  },
  {
    id: "fu-2",
    label: "Sample partner — introduction pending",
    channel: "partner",
    lastContact: null,
    cadenceDays: 14,
    dataKind: "sample",
    value: null,
  },
];

const SAMPLE_PIPELINE: PipelineItem[] = [
  {
    id: "pl-1",
    name: "Sample Law Firm — document execution retainer",
    channel: "attorney",
    stage: "proposal",
    value: 12000,
    lastContact: "2026-06-20",
    dataKind: "sample",
  },
  {
    id: "pl-2",
    name: "Sample Partner Agency — referral agreement",
    channel: "partner",
    stage: "qualified",
    value: 4000,
    lastContact: "2026-06-15",
    dataKind: "sample",
  },
  {
    id: "pl-3",
    name: "Sample County — notarization services",
    channel: "government",
    stage: "identified",
    value: 24000,
    lastContact: null,
    dataKind: "sample",
  },
  {
    id: "pl-4",
    name: "Sample International — apostille coordination",
    channel: "international",
    stage: "contacted",
    value: 9000,
    lastContact: "2026-07-01",
    dataKind: "sample",
  },
];

const SAMPLE_QUOTES: PipelineItem[] = SAMPLE_PIPELINE.filter(
  (p) => p.stage === "proposal" || p.stage === "negotiation",
);

const SAMPLE_CONTENT: ContentQueueItem[] = [
  {
    id: "c-1",
    title: "Sample article — how document execution works",
    format: "article",
    status: "scheduled",
    scheduledFor: "2026-07-12",
    channel: "direct",
    dataKind: "sample",
  },
  {
    id: "c-2",
    title: "Sample newsletter — monthly update",
    format: "newsletter",
    status: "drafting",
    scheduledFor: "2026-07-20",
    channel: "direct",
    dataKind: "sample",
  },
];

const SAMPLE_MARKETING: MarketingTask[] = [
  {
    id: "m-1",
    label: "Sample task — refresh attorney one-pager",
    dueDate: "2026-07-05",
    done: false,
    channel: "attorney",
    dataKind: "sample",
  },
  {
    id: "m-2",
    label: "Sample task — schedule partner webinar",
    dueDate: "2026-07-25",
    done: false,
    channel: "partner",
    dataKind: "sample",
  },
];

// Revenue records are all "sample" — none are shown as actual, so the daily
// revenue metric honestly resolves to a null / no-confirmed-revenue state.
const SAMPLE_REVENUE: RevenueRecord[] = [
  {
    id: "r-1",
    date: "2026-06-10",
    amount: 3500,
    channel: "attorney",
    dataKind: "sample",
    label: "Illustrative — not actual",
  },
  {
    id: "r-2",
    date: "2026-06-24",
    amount: 2200,
    channel: "partner",
    dataKind: "sample",
    label: "Illustrative — not actual",
  },
];

const SAMPLE_KPIS: KpiSnapshot[] = [
  { label: "new_relationships", actual: null, target: 5, unit: "count", dataKind: "projection" },
  { label: "quotes_issued", actual: null, target: 8, unit: "count", dataKind: "projection" },
  { label: "revenue_booked", actual: null, target: 15000, unit: "usd", dataKind: "projection" },
];

export default async function FounderDashboardPage() {
  await requireDashboardAccess();

  const summary = assembleDailyCommand({
    date: TODAY,
    followUps: SAMPLE_FOLLOWUPS,
    content: SAMPLE_CONTENT,
    pipeline: SAMPLE_PIPELINE,
    revenue: SAMPLE_REVENUE,
    openQuotes: SAMPLE_QUOTES,
  });

  return (
    <div className="max-w-6xl space-y-6">
      <DashboardPageHeader
        eyebrow="Founder Operating System"
        title="Founder Command"
        description="Daily command summary, follow-up engine, revenue review, pipeline queues, and content/marketing operations for the founder. Figures default to zero/empty or are clearly labeled sample/projection — never shown as actuals."
      />

      <p className="rounded-xl border border-amber-300/20 bg-black/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
        Internal operator view · Sample / projection data — not actual revenue or leads
      </p>

      <FounderCommandCenter summary={summary} />
      <DailyRevenuePanel summary={summary} />
      <PendingQuotesPanel quotes={SAMPLE_QUOTES} />
      <FounderFollowUps items={SAMPLE_FOLLOWUPS} now={TODAY} />
      <HighValueMatterQueue items={SAMPLE_PIPELINE} />

      <AttorneyPipeline items={SAMPLE_PIPELINE} />
      <PartnerPipeline items={SAMPLE_PIPELINE} />
      <GovernmentOpportunityQueue items={SAMPLE_PIPELINE} />
      <InternationalOpportunityQueue items={SAMPLE_PIPELINE} />

      <MarketingQueue tasks={SAMPLE_MARKETING} now={TODAY} />
      <ContentQueue items={SAMPLE_CONTENT} />

      <WeeklyKPIReview kpis={SAMPLE_KPIS} />
      <MonthlyRevenueReview records={SAMPLE_REVENUE} />
    </div>
  );
}
