import test from "node:test";
import assert from "node:assert/strict";
import { handleCounselOperatorPost } from "@/lib/counsel/operator-actions";
import { createAdminClient } from "@/lib/supabase/admin";
const reference = "126a94a2-83f0-4a10-b42e-ed0880a2dfb7";
const profileId = "27c94d41-8ed6-4e6b-a651-210c80220f65";
const matterId = "a175ed45-01ba-4ef3-8797-5ddc4d852318";
const request = (body: unknown) =>
  new Request("https://example.com/api/admin/counsel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
function fixture(
  options: {
    authorized?: boolean;
    emailMismatch?: boolean;
    concurrentEdit?: boolean;
    attributionMissing?: boolean;
    providerFailure?: boolean;
  } = {},
) {
  const lead = {
    id: reference,
    email: "counsel@example.com",
    country: "Italy",
    created_at: "2026-11-07T00:00:00Z",
    canonical_matter_id: null as string | null,
    details: {
      document_status: "received",
      document: { path: `counsel/${reference}/hash` },
      attribution: { source: "instagram" },
    } as Record<string, any>,
  }; // eslint-disable-line @typescript-eslint/no-explicit-any
  const writes: string[] = [],
    reads: string[] = [];
  const admin = {
    from(table: string) {
      reads.push(table);
      let values: Record<string, unknown> | null = null,
        snapshot: string | null = null;
      const query = {
        select() {
          return query;
        },
        eq(field: string, value: string) {
          if (field === "details") snapshot = value;
          return query;
        },
        or() {
          return query;
        },
        update(input: Record<string, unknown>) {
          values = input;
          return query;
        },
        async single() {
          return query.maybeSingle();
        },
        async maybeSingle() {
          if (table === "professional_profiles")
            return {
              data: {
                id: profileId,
                email: options.emailMismatch
                  ? "other@example.com"
                  : "counsel@example.com",
              },
              error: null,
            };
          if (table === "deals")
            return {
              data: {
                id: matterId,
                professional_profile_id: options.attributionMissing
                  ? null
                  : profileId,
                referral_source_type: options.attributionMissing
                  ? null
                  : "professional_submitted",
              },
              error: null,
            };
          if (values) {
            if (
              options.concurrentEdit ||
              (snapshot && snapshot !== JSON.stringify(lead.details))
            )
              return { data: null, error: null };
            writes.push(table);
            Object.assign(lead, values);
          }
          return { data: lead, error: null };
        },
      };
      return query;
    },
    storage: {
      from() {
        return {
          async createSignedUrl(path: string) {
            return {
              data: { signedUrl: `https://storage.example/private/${path}` },
              error: null,
            };
          },
        };
      },
    },
  };
  return {
    lead,
    writes,
    reads,
    deps: {
      actor: async () =>
        options.authorized === false ? null : "server-operator",
      admin: () => admin as unknown as ReturnType<typeof createAdminClient>,
      notify: async () =>
        options.providerFailure ? "failed" : "provider_accepted",
    },
  };
}
const responseEvidence = {
  id: "d711c9c3-ce4e-46b3-81d0-9e3e988ff56f",
  kind: "respond",
  note: "Completed the initial call with counsel",
  next_action: "Review the submitted context",
  channel: "phone",
  evidence_reference: "Operator call log 1",
};
test("anonymous/professional callers cannot invoke operator actions or enumerate documents", async () => {
  for (const action of [
    "record_action",
    "document",
    "link_matter",
    "retry_notification",
  ]) {
    const f = fixture({ authorized: false });
    const response = await handleCounselOperatorPost(
      request({
        reference,
        action,
        matter_id: matterId,
        operator_action: responseEvidence,
        actor: "admin",
        role: "service_role",
      }),
      f.deps,
    );
    assert.equal(response.status, 403);
    assert.deepEqual(f.reads, []);
    assert.deepEqual(f.writes, []);
  }
});
test("operator action persistence stamps the server actor and is retry-idempotent", async () => {
  const f = fixture();
  const body = {
    reference,
    action: "record_action",
    operator_action: {
      ...responseEvidence,
      actor: "spoofed",
      evidence_scope: "delivered",
    },
  };
  assert.equal(
    (await handleCounselOperatorPost(request(body), f.deps)).status,
    200,
  );
  assert.equal(f.lead.details.operator_actions[0].actor, "server-operator");
  assert.equal(
    f.lead.details.operator_actions[0].evidence_scope,
    "operator_attested",
  );
  const retry = await handleCounselOperatorPost(request(body), f.deps);
  assert.equal((await retry.json()).duplicate, true);
  assert.equal(f.lead.details.operator_actions.length, 1);
  assert.equal(f.lead.details.document_status, "received");
  assert.equal(f.lead.details.attribution.source, "instagram");
});
test("concurrent edits and missing response evidence fail closed without losing inquiry data", async () => {
  const f = fixture({ concurrentEdit: true });
  const response = await handleCounselOperatorPost(
    request({
      reference,
      action: "record_action",
      operator_action: responseEvidence,
    }),
    f.deps,
  );
  assert.equal(response.status, 409);
  assert.equal(f.lead.details.operator_actions, undefined);
  const invalid = fixture();
  const noEvidence = { ...responseEvidence, evidence_reference: "" };
  assert.equal(
    (
      await handleCounselOperatorPost(
        request({
          reference,
          action: "record_action",
          operator_action: noEvidence,
        }),
        invalid.deps,
      )
    ).status,
    400,
  );
  assert.deepEqual(invalid.writes, []);
});
test("qualification cannot assert a mismatched professional identity", async () => {
  const f = fixture({ emailMismatch: true });
  const response = await handleCounselOperatorPost(
    request({
      reference,
      action: "record_action",
      operator_action: {
        ...responseEvidence,
        kind: "qualify",
        professional_profile_id: profileId,
      },
    }),
    f.deps,
  );
  assert.equal(response.status, 409);
  assert.deepEqual(f.writes, []);
});
test("professional handoff requires canonical attribution; failures remain observable without Matter mutation", async () => {
  for (const options of [
    { attributionMissing: true },
    { emailMismatch: true },
  ]) {
    const f = fixture(options);
    const response = await handleCounselOperatorPost(
      request({ reference, action: "link_matter", matter_id: matterId }),
      f.deps,
    );
    assert.equal(response.status, 409);
    assert.equal(f.lead.canonical_matter_id, null);
    assert.ok(f.lead.details.handoff_failures.length);
    assert.ok(f.writes.every((table) => table === "sales_leads"));
  }
  const valid = fixture();
  assert.equal(
    (
      await handleCounselOperatorPost(
        request({ reference, action: "link_matter", matter_id: matterId }),
        valid.deps,
      )
    ).status,
    200,
  );
  assert.equal(valid.lead.canonical_matter_id, matterId);
  assert.ok(valid.writes.every((table) => table === "sales_leads"));
  const writesBeforeRetry = valid.writes.length;
  const retry = await handleCounselOperatorPost(
    request({ reference, action: "link_matter", matter_id: matterId }),
    valid.deps,
  );
  assert.equal((await retry.json()).duplicate, true);
  assert.equal(valid.writes.length, writesBeforeRetry);
});
test("notification retry preserves provider failure truth and signed document access stays operator-only", async () => {
  const f = fixture({ providerFailure: true });
  const response = await handleCounselOperatorPost(
    request({ reference, action: "retry_notification" }),
    f.deps,
  );
  assert.equal((await response.json()).notification, "failed");
  const document = await handleCounselOperatorPost(
    request({ reference, action: "document" }),
    f.deps,
  );
  assert.equal(document.status, 200);
  assert.ok((await document.json()).url.includes(`/counsel/${reference}/`));
  assert.deepEqual(f.writes, []);
});
