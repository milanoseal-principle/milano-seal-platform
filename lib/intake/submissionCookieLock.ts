export interface IntakeSubmissionLockManager {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

const SUBMISSION_COOKIE_LOCK = "milano-seal-intake-submission-cookie";

export function withIntakeSubmissionCookieLock<T>(
  initialize: () => Promise<T>,
  lockManager: IntakeSubmissionLockManager | null =
    typeof navigator !== "undefined" && navigator.locks ? navigator.locks : null,
): Promise<T> {
  if (!lockManager) {
    return Promise.reject(
      new Error("Secure intake requires a browser with cross-tab lock support. Please use a current browser."),
    );
  }

  return lockManager.request(SUBMISSION_COOKIE_LOCK, initialize);
}
