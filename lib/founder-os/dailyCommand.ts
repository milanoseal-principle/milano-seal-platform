import type {
  DailyCommandSummary,
  FollowUpItem,
  ContentQueueItem,
  PipelineItem,
  RevenueRecord,
  DataKind,
} from "./types";
import { deriveFollowUps, countDue, countOverdue } from "./followUpEngine";
import { contentDue } from "./contentQueue";
import { revenueOnDate } from "./revenueReview";

// Pure assembler for the founder's daily command summary. Pulls from the other
// pure engines. Reports honest zero/empty state and never fabricates figures:
// revenue is null unless there is at least one ACTUAL record for the day.

const HIGH_VALUE_THRESHOLD = 5000;

export interface DailyCommandInputs {
  date: string; // ISO date
  followUps?: FollowUpItem[];
  content?: ContentQueueItem[];
  pipeline?: PipelineItem[];
  revenue?: RevenueRecord[];
  openQuotes?: PipelineItem[]; // pipeline items awaiting a decision
}

function sumValues(items: { value: number | null }[]): number {
  return items.reduce(
    (sum, i) => sum + (typeof i.value === "number" && Number.isFinite(i.value) ? i.value : 0),
    0,
  );
}

function rollUpDataKind(records: RevenueRecord[], date: string): DataKind {
  const dayRecords = records.filter((r) => r.date === date);
  if (dayRecords.length === 0) return "sample";
  if (dayRecords.every((r) => r.dataKind === "actual")) return "actual";
  if (dayRecords.some((r) => r.dataKind === "projection")) return "projection";
  return "sample";
}

export function assembleDailyCommand(
  inputs: DailyCommandInputs,
): DailyCommandSummary {
  const {
    date,
    followUps = [],
    content = [],
    pipeline = [],
    revenue = [],
    openQuotes = [],
  } = inputs;

  const derived = deriveFollowUps(followUps, date);
  const due = countDue(derived);
  const overdue = countOverdue(derived);

  const dueContent = contentDue(content, date);

  const highValue = pipeline.filter(
    (p) =>
      p.stage !== "won" &&
      p.stage !== "lost" &&
      typeof p.value === "number" &&
      Number.isFinite(p.value) &&
      p.value >= HIGH_VALUE_THRESHOLD,
  ).length;

  // Only report confirmed (actual) revenue as a number; otherwise null.
  const actualRevenue = revenue.filter((r) => r.date === date && r.dataKind === "actual");
  const revenueToday = actualRevenue.length > 0 ? revenueOnDate(revenue, date) : null;

  const dataKind = rollUpDataKind(revenue, date);

  const openQuotesValue = openQuotes.length > 0 ? sumValues(openQuotes) : null;

  const headlineParts: string[] = [];
  if (overdue > 0) headlineParts.push(`${overdue} overdue follow-up${overdue === 1 ? "" : "s"}`);
  if (due > 0) headlineParts.push(`${due} due today`);
  if (highValue > 0) headlineParts.push(`${highValue} high-value matter${highValue === 1 ? "" : "s"}`);
  if (dueContent.length > 0) headlineParts.push(`${dueContent.length} content item${dueContent.length === 1 ? "" : "s"} due`);
  const headline =
    headlineParts.length > 0
      ? headlineParts.join(" · ")
      : "No actions flagged — clear board.";

  return {
    date,
    dataKind,
    revenueToday,
    openQuotes: openQuotes.length,
    openQuotesValue,
    followUpsDue: due,
    followUpsOverdue: overdue,
    highValueMatters: highValue,
    contentDue: dueContent.length,
    headline,
  };
}
