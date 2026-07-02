import { REVIEW_PLATFORM } from "./status";
import type { ReviewFlowRecord } from "./types";

export function getReviewDueDate(deliveryDate: string | null): string | null {
  if (!deliveryDate) return null;
  const date = new Date(deliveryDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + 3);
  return date.toISOString();
}

export function shouldSendReviewRequest(record: ReviewFlowRecord, now = new Date()): boolean {
  if (!record.deliveryDate || record.reviewEmailSent || record.reviewCompleted) return false;
  const due = record.reviewEmailDue ?? getReviewDueDate(record.deliveryDate);
  if (!due) return false;
  return new Date(due).getTime() <= now.getTime();
}

export function buildReviewRequestQueue(records: ReviewFlowRecord[]): ReviewFlowRecord[] {
  return records.filter((record) => shouldSendReviewRequest(record));
}

export function getReviewPlatformOptions(): readonly string[] {
  return REVIEW_PLATFORM;
}

export function markReviewSentPayload(record: ReviewFlowRecord) {
  return {
    dealId: record.dealId,
    reviewEmailSent: true,
    reviewLinkSentAt: new Date().toISOString(),
    reviewPlatform: record.reviewPlatform ?? "Google",
    notes: "Review request prepared after final delivery. No fake reviews or fake stars.",
  };
}
