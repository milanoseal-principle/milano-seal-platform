import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Locks the Today command-center compression: the first operator surface is
// reorganized (Immediate Action → telemetry → pipeline → Priority Matters →
// collapsible More Intelligence), but EVERY existing module is preserved — the
// reorg is composition-only. No module may be deleted, and no fabricated
// operational status may be introduced.

const page = fs.readFileSync(
  path.join(process.cwd(), "app/dashboard/page.tsx"),
  "utf8",
);

test("command-center sections are present and ranked on the Today surface", () => {
  assert.match(page, /Immediate Action/);
  assert.match(page, /Priority Matters/i);
  assert.match(page, /More Intelligence/);
  // Secondary depth is collapsed behind a native, accessible disclosure.
  assert.match(page, /<details/);
  assert.match(page, /<summary/);
});

test("every pre-existing Today module is still rendered (nothing removed)", () => {
  const preservedModules = [
    "InternalModuleGrid",
    "ExecutionOrchestrationPipeline",
    "StatusGlowMatrix",
    "ExecutionStatusRail",
    "MatterQueue",
    "GlobalExecutionIntelligence",
    "ChainOfCustodyIntelligence",
    "CourierIntelligencePanel",
    "DestinationIntelligenceWidget",
    "CountryHealthMatrix",
    "OperatorEventTimeline",
    "ExecutionPipeline",
    "MattersByStatus",
    "TrustEngineAlerts",
    "RecentActivityFeed",
    "TopCountriesPanel",
    "TopDocumentsPanel",
    "LiveEventBusStream",
    "OperatorActionPanel",
  ];
  for (const mod of preservedModules) {
    assert.ok(
      new RegExp(`<${mod}\\b`).test(page),
      `Today surface must still render <${mod}> — module was removed`,
    );
  }
  // Inline sections that carry canonical data must also remain.
  assert.match(page, /Finance Snapshot/);
  assert.match(page, /Audit Ledger/);
  assert.match(page, /Service Lanes/);
  assert.match(page, /Recent Matters/);
});

test("key modules appear exactly once (no accidental duplication in the reorg)", () => {
  const once = (needle: string) =>
    page.split(needle).length - 1 === 1;
  assert.ok(once("<MatterQueue"), "MatterQueue must render exactly once");
  assert.ok(once("<InternalModuleGrid"), "InternalModuleGrid must render exactly once");
  assert.ok(once("<ExecutionStatusRail"), "ExecutionStatusRail must render exactly once");
});

test("Today surface invents no fabricated operational status labels", () => {
  // Status/telemetry must derive from canonical `data.*`, never hard-coded truth.
  // Guard against literal fabricated states slipping into the markup.
  assert.doesNotMatch(page, />\s*(PAID|SCHEDULED|VERIFIED|COMPLETED|SHIPPED|APOSTILLED)\s*</);
});


test("Immediate Action distinguishes SLA loading/error from verified empty results", () => {
  assert.match(page, /isLoading:\s*slaAlertsLoading/);
  assert.match(page, /isError:\s*slaAlertsError/);
  assert.match(page, /Checking SLA status/);
  assert.match(page, /SLA status unavailable\. Do not treat this as an all-clear\./);
  assert.match(page, /slaAlerts\.length > 0/);
  assert.match(page, /No SLA escalations\. Every matter is within service thresholds\./);
});
