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
  assert.match(record.notes.join(" "), /server-validate DAMIANI50/i);
  assert.match(record.notes.join(" "), /No payment, revenue, scheduling, execution, or code redemption/i);
});

test("lost opportunities never inflate collected revenue", () => {
  const projection = getCommandCenterWorkbookProjection();
  const lost = projection.opportunities.filter((item) => item.closeStatus === "Lost");
  assert.equal(lost.length, 2);
  assert.equal(lost.reduce((sum, item) => sum + item.collectedRevenue, 0), 0);
  assert.equal(projection.collectedRevenue, 998.03);
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
  assert.match(first.projectionId, /^[a-f0-9]{64}:command-center-v2$/);
  assert.equal(first.sourceSha256, first.projectionId.split(":")[0]);

  const abujhaisha = first.opportunities.find((item) => item.clientName === "Abujhaisha");
  assert.ok(abujhaisha);
  assert.equal(first.sourceAttribution[abujhaisha.id], "Snapdocs");
  assert.equal(first.opportunities.every((item) => item.provenance.authority === "evidence_only"), true);
  assert.equal(first.opportunities.every((item) => item.provenance.sourceSha256 === first.sourceSha256), true);
});
