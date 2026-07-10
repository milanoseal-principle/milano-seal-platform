import type {
  ContentQueueItem,
  MarketingTask,
  ContentStatus,
} from "./types";

// Pure content/marketing queue helpers. No fabricated engagement or reach.

const DAY_MS = 24 * 60 * 60 * 1000;

function toDay(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.floor(t / DAY_MS);
}

export function countByStatus(
  items: ContentQueueItem[],
): Record<ContentStatus, number> {
  const base: Record<ContentStatus, number> = {
    idea: 0,
    drafting: 0,
    scheduled: 0,
    published: 0,
  };
  for (const i of items) base[i.status] = (base[i.status] ?? 0) + 1;
  return base;
}

// Content scheduled to publish on or before `now` but not yet published.
export function contentDue(items: ContentQueueItem[], now: string): ContentQueueItem[] {
  const nowDay = toDay(now);
  if (nowDay === null) return [];
  return items.filter((i) => {
    if (i.status === "published") return false;
    const d = toDay(i.scheduledFor);
    return d !== null && d <= nowDay;
  });
}

// Upcoming scheduled content, soonest first.
export function upcomingContent(items: ContentQueueItem[]): ContentQueueItem[] {
  return items
    .filter((i) => i.status !== "published" && i.scheduledFor)
    .sort((a, b) => (a.scheduledFor! < b.scheduledFor! ? -1 : 1));
}

export function openMarketingTasks(tasks: MarketingTask[]): MarketingTask[] {
  return tasks.filter((t) => !t.done);
}

export function overdueMarketingTasks(
  tasks: MarketingTask[],
  now: string,
): MarketingTask[] {
  const nowDay = toDay(now);
  if (nowDay === null) return [];
  return tasks.filter((t) => {
    if (t.done) return false;
    const d = toDay(t.dueDate);
    return d !== null && d < nowDay;
  });
}

export function marketingCompletionRate(tasks: MarketingTask[]): number {
  if (tasks.length === 0) return 0; // divide-by-zero guard
  const done = tasks.filter((t) => t.done).length;
  return done / tasks.length;
}
