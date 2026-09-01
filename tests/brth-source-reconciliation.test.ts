import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  FIELD_VISIT_HARD_STOPS,
  FIELD_VISIT_PROTOCOL,
} from "../lib/operations/field-visit-protocol";
import {
  ITALY_RECORD_OPERATOR_GATES,
  VASTOGIRARDI_HISTORICAL_FEES,
  VASTOGIRARDI_RECORD_OPTIONS,
  VASTOGIRARDI_SOURCE_RULES,
} from "../lib/intelligence/italy-municipal-records";

const runtimeFiles = [
  "lib/operations/field-visit-protocol.ts",
  "lib/intelligence/italy-municipal-records.ts",
  "app/dashboard/field-visits/page.tsx",
  "app/dashboard/italy-records/page.tsx",
  "components/dashboard/modules/runbook.tsx",
  "components/dashboard/modules/countries.tsx",
];

const runtime = runtimeFiles
  .map((file) => `${file}\n${readFileSync(file, "utf8")}`)
  .join("\n");

test("BRTH field-visit donor is converted into governed operator protocol", () => {
  const joined = FIELD_VISIT_PROTOCOL.map((step) => `${step.title} ${step.instruction} ${step.evidence ?? ""}`).join(" ").toLowerCase();
  assert.match(joined, /second residential visit|second visit|return visit/);
  assert.match(joined, /photograph/);
  assert.match(joined, /sealed envelope/);
  assert.match(joined, /scan back|scanback/);
  assert.match(joined, /originals/);
  assert.ok(FIELD_VISIT_HARD_STOPS.some((rule) => /guessed notarial act/i.test(rule)));
  assert.ok(FIELD_VISIT_PROTOCOL.some((step) => step.hardStop));
});

test("BRTH Italy authority source remains source-specific and fail-safe", () => {
  assert.equal(VASTOGIRARDI_RECORD_OPTIONS.length, 13);
  assert.deepEqual(
    VASTOGIRARDI_HISTORICAL_FEES.map((fee) => fee.amountEur),
    [150, 300],
  );
  assert.ok(
    VASTOGIRARDI_SOURCE_RULES.some((rule) => /not refundable/i.test(rule)),
  );
  assert.ok(
    ITALY_RECORD_OPERATOR_GATES.some((gate) => /actual Comune/i.test(gate)),
  );
  assert.ok(
    ITALY_RECORD_OPERATOR_GATES.some((gate) => /do not infer entitlement/i.test(gate)),
  );
});

test("BRTH runtime does not reintroduce retired donor architecture", () => {
  const forbidden = [
    "themilanoseal-backend.onrender.com",
    "zelle",
    "venmo",
    "apple cash",
    "cash app",
    "stripe",
    "sovereign document execution authority",
    "diplomatic logistics",
    "live event injected by system",
  ];

  for (const token of forbidden) {
    assert.equal(
      runtime.toLowerCase().includes(token.toLowerCase()),
      false,
      `BRTH runtime must not contain retired donor token: ${token}`,
    );
  }
});

test("BRTH source audit records quarantine decisions", () => {
  const audit = readFileSync("docs/source-audits/BRTH_SOURCE_RECONCILIATION.md", "utf8");
  assert.match(audit, /Field Visit Control/);
  assert.match(audit, /Italy Municipal Records Desk/);
  assert.match(audit, /VISUAL DONOR ONLY/);
  assert.match(audit, /No second Matter engine/);
  assert.match(audit, /Final settlement-dependent international release remains fail-closed/);
});
