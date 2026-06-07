import type { QAStatus } from "./status";

export function assertExecutionQAPassed(qaStatus: QAStatus): void {
  if (qaStatus !== "PASSED") {
    throw new Error(`Execution QA gate: status is ${qaStatus}. Must be PASSED before apostille submission, courier label purchase, or release review.`);
  }
}

export function canSubmitApostille(qaStatus: QAStatus): boolean {
  return qaStatus === "PASSED";
}

export function canPurchaseCourierLabel(qaStatus: QAStatus): boolean {
  return qaStatus === "PASSED";
}

export function canInitiateRelease(qaStatus: QAStatus): boolean {
  return qaStatus === "PASSED";
}

export function qaBlocksProgress(qaStatus: QAStatus): boolean {
  return qaStatus === "BLOCKED" || qaStatus === "REVIEW_REQUIRED";
}
