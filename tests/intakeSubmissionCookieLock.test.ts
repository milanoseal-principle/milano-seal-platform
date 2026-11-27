import assert from "node:assert/strict";
import { test } from "node:test";
import {
  withIntakeSubmissionCookieLock,
  type IntakeSubmissionLockManager,
} from "@/lib/intake/submissionCookieLock";

function exclusiveLockManager(): IntakeSubmissionLockManager {
  let queue = Promise.resolve();
  return {
    request<T>(_name: string, callback: () => Promise<T>): Promise<T> {
      const result = queue.then(callback);
      queue = result.then(() => undefined, () => undefined);
      return result;
    },
  };
}

test("concurrent tabs initialize one shared submission cookie", async () => {
  const locks = exclusiveLockManager();
  let cookie: string | null = null;
  let initializationCount = 0;

  const initialize = async () => {
    if (!cookie) {
      initializationCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      cookie = "shared-server-cookie";
    }
    return cookie;
  };

  const tokens = await Promise.all(
    Array.from({ length: 8 }, () => withIntakeSubmissionCookieLock(initialize, locks)),
  );

  assert.deepEqual(new Set(tokens), new Set(["shared-server-cookie"]));
  assert.equal(initializationCount, 1);
});

test("submission cookie initialization fails closed without cross-tab lock support", async () => {
  let initialized = false;
  await assert.rejects(
    withIntakeSubmissionCookieLock(async () => {
      initialized = true;
    }, null),
    /cross-tab lock support/,
  );
  assert.equal(initialized, false);
});
