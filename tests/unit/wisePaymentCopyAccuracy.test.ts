import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { clientSafePaymentLabel } from "@/lib/security/client-projection";

const read = (file: string) => fs.readFileSync(file, "utf8");
const clientSurfaces = [
  "components/portal/WiseTransferInstructions.tsx",
  "components/portal/WisePaymentCard.tsx",
  "app/api/portal/me/matter-intelligence/route.ts",
  "lib/security/client-projection.ts",
];

test("no client surface claims scheduling unlocks from payment alone", () => {
  for (const file of clientSurfaces) {
    const source = read(file);
    assert.doesNotMatch(source, /Scheduling Unlocked|unlocks automatically/i, file);
  }
  assert.equal(clientSafePaymentLabel(true, true), "Platform Fee Confirmed");
  assert.match(read("components/portal/WisePaymentCard.tsx"), /every other requirement for your Matter is met/);
});

test("Wise beneficiary name is configured, never hardcoded or guessed", () => {
  const source = read("components/portal/WiseTransferInstructions.tsx");
  assert.doesNotMatch(source, /The Milano Seal LLC|Milano Seal International LLC/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_WISE_BENEFICIARY_NAME/);
  assert.match(source, /As stated on your Milano invoice/);
  assert.doesNotMatch(source, /within minutes/);
  assert.match(read(".env.example"), /^NEXT_PUBLIC_WISE_BENEFICIARY_NAME=$/m);
});
