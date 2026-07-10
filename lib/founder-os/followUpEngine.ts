import type {
  FollowUpItem,
  DerivedFollowUp,
  FollowUpStatus,
} from "./types";

// Pure follow-up derivation. Computes due/overdue status from lastContact and
// cadence. Never invents contacts — a null lastContact is treated as overdue
// (relationship needs a first touch), never as "recently contacted".

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDay(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor(t / DAY_MS);
}

function addDaysIso(iso: string, days: number): string | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return new Date(t + days * DAY_MS).toISOString().slice(0, 10);
}

// Derive a single follow-up's status relative to `now` (ISO date).
export function deriveFollowUp(
  item: FollowUpItem,
  now: string,
): DerivedFollowUp {
  const nowDay = toUtcDay(now);

  if (!item.lastContact || nowDay === null) {
    // Never contacted (or invalid clock): needs a first touch — overdue.
    return {
      ...item,
      status: "overdue",
      daysUntilDue: null,
      dueDate: null,
    };
  }

  const lastDay = toUtcDay(item.lastContact);
  if (lastDay === null) {
    return { ...item, status: "overdue", daysUntilDue: null, dueDate: null };
  }

  const cadence = Number.isFinite(item.cadenceDays) && item.cadenceDays > 0
    ? item.cadenceDays
    : 0;
  const dueDay = lastDay + cadence;
  const daysUntilDue = dueDay - nowDay;
  const dueDate = addDaysIso(item.lastContact, cadence);

  let status: FollowUpStatus;
  if (daysUntilDue < 0) status = "overdue";
  else if (daysUntilDue === 0) status = "due";
  else status = "upcoming";

  return { ...item, status, daysUntilDue, dueDate };
}

// Derive all follow-ups, sorted most-urgent first (overdue, then due, then
// upcoming by soonest due date).
export function deriveFollowUps(
  items: FollowUpItem[],
  now: string,
): DerivedFollowUp[] {
  const rank: Record<FollowUpStatus, number> = {
    overdue: 0,
    due: 1,
    upcoming: 2,
  };
  return items
    .map((i) => deriveFollowUp(i, now))
    .sort((a, b) => {
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      const av = a.daysUntilDue ?? -Infinity;
      const bv = b.daysUntilDue ?? -Infinity;
      return av - bv;
    });
}

export function countDue(items: DerivedFollowUp[]): number {
  return items.filter((i) => i.status === "due").length;
}

export function countOverdue(items: DerivedFollowUp[]): number {
  return items.filter((i) => i.status === "overdue").length;
}
