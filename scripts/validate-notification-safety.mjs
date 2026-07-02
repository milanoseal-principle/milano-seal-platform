// validate:notification-safety — guards client-facing notification copy.
//
// Asserts the notification orchestrator (lib/notifications/orchestrator.ts):
//   1. exposes copy for every declared NotificationEvent (no missing event),
//   2. contains no forbidden internal/unsafe language in client copy, and
//   3. includes the receiving-authority boundary on acceptance-related events.

import { readFileSync } from "fs";

const src = readFileSync("lib/notifications/orchestrator.ts", "utf8");

function unionMembers(typeName) {
  const m = src.match(new RegExp(`export type ${typeName} =([\\s\\S]*?);`));
  if (!m) throw new Error(`could not find type ${typeName}`);
  return [...m[1].matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
}

const events = unionMembers("NotificationEvent");
const copyKeys = [
  ...src.matchAll(/^\s*([a-z_]+):\s*\{/gm),
].map((x) => x[1]);

const errors = [];

// 1. Every event has copy.
for (const e of events) {
  if (!copyKeys.includes(e)) errors.push(`event "${e}" has no NOTIFICATION_COPY entry`);
}

// 2. No forbidden internal/unsafe language anywhere in the copy map.
const FORBIDDEN = [
  /\bmargin\b/i,
  /\bcost basis\b/i,
  /\boperator note/i,
  /\binternal\b/i,
  /\blegal advice\b/i,
  /\bguarantee/i,
  /\bnotarize from anywhere\b/i,
];
const copyBlock = src.slice(src.indexOf("NOTIFICATION_COPY"));
for (const re of FORBIDDEN) {
  if (re.test(copyBlock)) errors.push(`forbidden phrase in notification copy: ${re}`);
}

// 3. Receiving-authority boundary on acceptance-related events.
const NEEDS_BOUNDARY = [
  "apostille_submitted",
  "apostille_completed",
  "release_ready",
  "delivered",
  "completed",
];
for (const e of NEEDS_BOUNDARY) {
  const block = copyBlock.match(new RegExp(`${e}:\\s*\\{([\\s\\S]*?)\\},`));
  // Accept either the inlined phrase or the shared RECEIVING_AUTHORITY_BOUNDARY const.
  if (
    !block ||
    !/receiving authority|RECEIVING_AUTHORITY_BOUNDARY/i.test(block[1])
  ) {
    errors.push(`event "${e}" missing receiving-authority boundary language`);
  }
}

if (errors.length) {
  console.error("validate:notification-safety FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} notification-safety error(s)`);
}

console.log(
  `validate:notification-safety passed (${events.length} events, all client-safe & boundary-checked)`,
);
