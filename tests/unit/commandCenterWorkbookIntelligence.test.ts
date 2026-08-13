import assert from "node:assert/strict";
import test from "node:test";
import { getCommandCenterWorkbookProjection } from "../../lib/command-center/workbookIntelligence";

test("Damiani third record remains open and pre-revenue", () => {
  const projection = getCommandCenterWorkbookProjection();
  const record = projection.opportunities.find((item) => item.id === "MS-DAMIANI-2026-003");
  assert.ok(record);
  assert.equal(record.stage, "Pre-Revenue");
  assert.equal(record.closeStatus, "Open");
  assert.equal(record.paymentStatus, "None");
  assert.equal(record.collectedRevenue, 0);
  assert.equal(record.protectedCode, "DAMIANI50");
  assert.match(record.notes.join(" "), /server before applying/i);
  assert.match(record.notes.join(" "), /No redemption, payment, scheduling, or execution/i);
});

test("lost opportunities never inflate collected revenue", () => {
  const projection = getCommandCenterWorkbookProjection();
  const lost = projection.opportunities.filter((item) => item.closeStatus === "Lost");
  assert.equal(lost.length, 2);
  assert.equal(lost.reduce((sum, item) => sum + item.collectedRevenue, 0), 0);
  assert.equal(projection.collectedRevenue, 120);
});

test("client registry preserves Damiani history and collected lifetime value", () => {
  const projection = getCommandCenterWorkbookProjection();
  const client = projection.clients.find((item) => item.clientName === "Irene Damiani");
  assert.ok(client);
  assert.equal(client.totalHistoricalAndOpportunityRecords, 3);
  assert.equal(client.lifetimeCollectedValue, 760.03);
  assert.equal(client.openOpportunities, 1);
});

test("projection is deterministic and provenance-backed", () => {
  const first = getCommandCenterWorkbookProjection();
  const second = getCommandCenterWorkbookProjection();
  assert.deepEqual(second, first);
  assert.equal(first.projectionId, "9c3d5f14920f207925275c903dbe0b38dcf39f63:command-center-v1");
  assert.equal(first.sourceAttribution["WORKBOOK-ABUJHAISHA-120"], "Snapdocs");
  assert.equal(first.opportunities.every((item) => item.provenance.authority === "evidence_only"), true);
});
