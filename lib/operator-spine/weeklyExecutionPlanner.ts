import type { WeeklyExecutionBlock, WeeklyExecutionDay } from "./types";

const FOCUS: Record<WeeklyExecutionDay, readonly string[]> = {
  Monday: ["intake review", "quote follow-up", "payment reconciliation"],
  Tuesday: ["execution scheduling", "BlueNotary / RON follow-up", "client communication"],
  Wednesday: ["apostille packet review", "courier checks", "partner follow-up"],
  Thursday: ["alliance review", "SEO/content authority tasks", "referral follow-up"],
  Friday: ["revenue closeout", "release confirmations", "next-week planning"],
  Weekend: ["rush only", "executive exceptions only"]
};

export function buildWeeklyExecutionPlanner(input: { blocks?: readonly WeeklyExecutionBlock[] } = {}) {
  return input.blocks?.length ? input.blocks : getWeeklyPlannerBlocks();
}
export function getWeeklyPlannerBlocks(): readonly WeeklyExecutionBlock[] {
  return (Object.keys(FOCUS) as WeeklyExecutionDay[]).map((day) => ({ id: day.toLowerCase(), day, title: `${day} Execution Block`, focus: FOCUS[day].join(" / "), items: FOCUS[day], ownerRole: "operator", status: "staged", notes: "Planning rhythm only; no fake live work items." }));
}
export function getWeeklyPlannerEmptyState() { return "Weekly planner is staged until matter data and operator priorities are connected."; }
export function getWeeklyFocusForDay(day: WeeklyExecutionDay) { return FOCUS[day] ?? []; }
