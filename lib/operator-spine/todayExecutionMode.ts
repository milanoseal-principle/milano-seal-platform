import type { TodayExecutionCategory, TodayExecutionItem } from "./types";

const CATEGORY_ACTIONS: Record<TodayExecutionCategory, string> = {
  review_needed: "Review matter intake completeness before quote.",
  quote_needed: "Prepare execution quote for operator approval.",
  payment_verify: "Founder/admin verifies payment before scheduling.",
  schedule_ready: "Schedule only after payment is confirmed or approved comped.",
  execution_today: "Confirm signer path and execution checklist.",
  apostille_processing: "Review apostille packet status and custody notes.",
  courier_release: "Confirm custody clearance before courier release.",
  client_follow_up: "Draft client update for operator review.",
  partner_follow_up: "Draft partner follow-up with internal notes withheld.",
  alliance_review: "Keep alliance routing staged until operator approval.",
  seo_authority: "Stage authority content for review.",
  closeout: "Move blocker to daily closeout."
};

export function buildTodayExecutionMode(input: { items?: readonly TodayExecutionItem[] } = {}) {
  return { items: input.items ?? [], grouped: groupTodayExecutionItems(input.items ?? []), emptyState: getTodayExecutionEmptyState() };
}

export function groupTodayExecutionItems(items: readonly TodayExecutionItem[]) {
  return items.reduce<Record<TodayExecutionCategory, TodayExecutionItem[]>>((groups, item) => {
    groups[item.category] = [...(groups[item.category] ?? []), item];
    return groups;
  }, {} as Record<TodayExecutionCategory, TodayExecutionItem[]>);
}

export function getTodayExecutionPriority(item: TodayExecutionItem) {
  if (item.risk === "payment_sensitive" || item.risk === "custody_sensitive") return "urgent";
  return item.priority;
}

export function getTodayExecutionNextAction(item: TodayExecutionItem) {
  return item.nextAction || CATEGORY_ACTIONS[item.category];
}

export function getTodayExecutionEmptyState() {
  return "No live data connected yet. This module is ready for operator use once matter data is connected.";
}
