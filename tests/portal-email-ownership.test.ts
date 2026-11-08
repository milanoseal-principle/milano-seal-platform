import test from "node:test";
import assert from "node:assert/strict";
import type { User } from "@supabase/supabase-js";
import { getAllClientDeals } from "@/lib/portalAuth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
function fixture(overrides: Partial<User> = {}) {
  const user = {
    id: "client",
    email: "Alex_One@example.com",
    email_confirmed_at: "2026-11-07T00:00:00Z",
    app_metadata: { role: "client" },
    ...overrides,
  } as User;
  let queried = false,
    pattern = "";
  const rows = [
    { id: "own", email: "ALEX_ONE@example.com" },
    { id: "other", email: "alexXone@example.com" },
    { id: "missing", email: null },
    { id: "similar", email: "alex_one@example.com.other" },
  ];
  const admin = {
    from() {
      queried = true;
      let cursor:string|undefined;
      return {
        select() {
          return this;
        },
        ilike(_field: string, value: string) {
          pattern = value;
          return this;
        },
        order(){return this;},limit(){return this;},lt(_field:string,value:string){cursor=value;return this;},
        then(resolve:(value:unknown)=>unknown){return Promise.resolve({data:rows.filter(row=>!cursor||row.id<cursor).sort((a,b)=>b.id.localeCompare(a.id))}).then(resolve);},
      };
    },
  };
  return {
    user,
    rows,
    queried: () => queried,
    pattern: () => pattern,
    dependencies: {
      session: async () =>
        ({
          auth: { getUser: async () => ({ data: { user } }) },
        }) as unknown as Awaited<ReturnType<typeof createClient>>,
      admin: () => admin as unknown as ReturnType<typeof createAdminClient>,
    },
  };
}
test("portal email lookup escapes SQL wildcard characters and only returns exact normalized ownership", async () => {
  const f = fixture();
  const result = await getAllClientDeals(f.dependencies);
  assert.equal(f.pattern(), "alex\\_one@example.com");
  assert.deepEqual(
    result?.deals.map((deal) => deal.id),
    ["own"],
  );
});
test("wildcard aliases and percent characters cannot expose another client's Matter", async () => {
  const f = fixture({ email: "alex*one@example.com" });
  f.rows.push({ id: "literal-star", email: "alex*one@example.com" });
  assert.deepEqual(
    (await getAllClientDeals(f.dependencies))?.deals.map((deal) => deal.id),
    ["literal-star"],
  );
  const percent = fixture({ email: "alex%one@example.com" });
  percent.rows.push({ id: "literal-percent", email: "alex%one@example.com" });
  assert.equal(
    (await getAllClientDeals(percent.dependencies))?.deals.length,
    1,
  );
  assert.equal(percent.pattern(), "alex\\%one@example.com");
});
test("unverified, disabled, professional and operator sessions cannot query client Matter data", async () => {
  for (const overrides of [
    { email_confirmed_at: undefined },
    { app_metadata: { role: "client", disabled: true } },
    { app_metadata: { role: "professional" } },
    { app_metadata: { role: "founder_admin" } },
    { app_metadata: {} },
    { email: undefined },
  ]) {
    const f = fixture(overrides);
    assert.equal(await getAllClientDeals(f.dependencies), null);
    assert.equal(f.queried(), false);
  }
});
