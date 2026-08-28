import assert from "node:assert/strict";
import test from "node:test";
import { collectAllProjectionRows, MATTER_PROJECTION_PAGE_SIZE } from "@/lib/matter/readAllDealsForProjection";

test("projection pagination includes Matter rows beyond 500 without duplicates or skips", async () => {
  const fixtures = Array.from({ length: 1101 }, (_, index) => ({ id: `matter-${String(index + 1).padStart(4, "0")}` }));
  const calls: Array<{ offset: number; limit: number }> = [];

  const rows = await collectAllProjectionRows(async (offset, limit) => {
    calls.push({ offset, limit });
    return fixtures.slice(offset, offset + limit);
  });

  assert.equal(MATTER_PROJECTION_PAGE_SIZE, 500);
  assert.equal(rows.length, 1101);
  assert.equal(rows[500]?.id, "matter-0501");
  assert.equal(rows[1100]?.id, "matter-1101");
  assert.equal(new Set(rows.map((row) => row.id)).size, 1101);
  assert.deepEqual(calls, [
    { offset: 0, limit: 500 },
    { offset: 500, limit: 500 },
    { offset: 1000, limit: 500 },
  ]);
});

test("projection pagination performs one terminating empty read for exact page multiples", async () => {
  const fixtures = Array.from({ length: 1000 }, (_, index) => ({ id: index + 1 }));
  let calls = 0;

  const rows = await collectAllProjectionRows(async (offset, limit) => {
    calls += 1;
    return fixtures.slice(offset, offset + limit);
  });

  assert.equal(rows.length, 1000);
  assert.equal(calls, 3);
});

test("projection pagination rejects an oversized page returned by a broken reader", async () => {
  await assert.rejects(
    collectAllProjectionRows(async () => Array.from({ length: 501 }, (_, id) => ({ id })), 500),
    /more rows than requested/i,
  );
});
