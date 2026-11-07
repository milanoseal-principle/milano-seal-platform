import test from "node:test";
import assert from "node:assert/strict";
import { receiveCounselInquiry } from "@/lib/counsel/receive";
import {
  counselAttribution,
  counselHref,
  documentError,
  inquirySchema,
} from "@/lib/counsel/inquiry";
import { createAdminClient } from "@/lib/supabase/admin";
const payload = {
  request_id: "b628ed63-a1ed-4603-8094-c10acc105b84",
  intent: "execution_review",
  full_name: "Maria Rossi",
  firm: "Rossi & Partners",
  country: "Italy",
  email: "maria@example.com",
  destination: "Italy",
  summary: "A client in Florida needs a power of attorney executed.",
  attribution: { source: "instagram", campaign: "counsel" },
};
function request(body = payload, file?: File) {
  const form = new FormData();
  form.set("inquiry", JSON.stringify(body));
  if (file) form.set("document", file);
  return new Request("https://www.themilanoseal.com/api/counsel", {
    method: "POST",
    headers: { origin: "https://www.themilanoseal.com" },
    body: form,
  });
}
function fixture(
  options: {
    persistenceFailure?: boolean;
    uploadFailure?: boolean;
    notificationFailure?: boolean;
  publicBucket?: boolean;
  metadataFailure?: boolean;
  } = {},
) {
  const rows = new Map<string, Record<string, any>>(); // eslint-disable-line @typescript-eslint/no-explicit-any
  const writes: string[] = [];
  let uploads = 0,
    alerts = 0;
  const admin = {
    from(table: string) {
      let mode = "select",
        input: Record<string, any> = {},
        id: string | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
      const query = {
        select() {
          return query;
        },
        eq(field: string, value: string) {
          if (field === "id") id = value;
          return query;
        },
        gte() {
          return query;
        },
        insert(value: Record<string, unknown>) {
          mode = "insert";
          input = value;
          return query;
        },
        update(value: Record<string, unknown>) {
          mode = "update";
          input = value;
          return query;
        },
        maybeSingle() {
          return Promise.resolve({
            data: rows.get(id ?? "") ?? null,
            error: null,
          });
        },
        then(resolve: (value: unknown) => unknown) {
          if (mode === "insert" || mode === "update") {
            writes.push(table);
            if (options.persistenceFailure || (mode === "update" && options.metadataFailure))
              return Promise.resolve(
                resolve({ error: { code: "DATABASE_UNAVAILABLE" } }),
              );
            if (mode === "insert") rows.set(input.id, input);
            else rows.set(id!, { ...rows.get(id!), ...input });
          }
          return Promise.resolve(resolve({ error: null, count: 0 }));
        },
      };
      return query;
    },
    storage: {
      async getBucket() {
        return { data: { public: options.publicBucket ?? false }, error: null };
      },
      from() {
        return {
          async upload() {
            uploads++;
            return {
              error: options.uploadFailure
                ? { message: "storage unavailable" }
                : null,
            };
          },
        };
      },
    },
  };
  return {
    rows,
    writes,
    uploads: () => uploads,
    alerts: () => alerts,
    dependencies: {
      admin: () => admin as unknown as ReturnType<typeof createAdminClient>,
      notify: async () => {
        alerts++;
        if (options.notificationFailure)
          throw new Error("provider unavailable");
        return "provider_accepted";
      },
    },
  };
}
test("anonymous inquiry persists once and retains acquisition without creating a Matter", async () => {
  const f = fixture();
  const response = await receiveCounselInquiry(request(), f.dependencies);
  assert.equal(response.status, 200);
  const receipt = await response.json();
  assert.equal(receipt.ok, true);
  assert.equal(receipt.document_status, "not_provided");
  const row = f.rows.get(payload.request_id)!;
  assert.equal(row.details.attribution.source, "instagram");
  assert.deepEqual(f.writes, ["sales_leads"]);
  assert.equal(
    (await receiveCounselInquiry(request(), f.dependencies)).status,
    200,
  );
  assert.equal(f.rows.size, 1);
  assert.deepEqual(f.writes, ["sales_leads"]);
});
test("persistence failure never returns receipt or attempts notification", async () => {
  const f = fixture({ persistenceFailure: true });
  const response = await receiveCounselInquiry(request(), f.dependencies);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  assert.equal(f.alerts(), 0);
});
test("upload receipt requires storage and metadata confirmation, retry uses same inquiry", async () => {
  const f = fixture();
  const file = new File(["%PDF-1.4 test"], "instruction.pdf", {
    type: "application/pdf",
  });
  const response = await receiveCounselInquiry(
    request(payload, file),
    f.dependencies,
  );
  assert.equal((await response.json()).document_status, "received");
  await receiveCounselInquiry(request(payload, file), f.dependencies);
  assert.equal(f.uploads(), 1);
  assert.equal(f.rows.size, 1);
});
test("failed upload stays pending and never claims success", async () => {
  const f = fixture({ uploadFailure: true });
  const file = new File(["%PDF-1.4 test"], "instruction.pdf", {
    type: "application/pdf",
  });
  const response = await receiveCounselInquiry(
    request(payload, file),
    f.dependencies,
  );
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  assert.equal(
    f.rows.get(payload.request_id)!.details.document_status,
    "pending",
  );
  assert.equal(f.alerts(), 0);
});
test("notification failure is separate from a successfully saved inquiry", async () => {
  const f = fixture({ notificationFailure: true });
  const response = await receiveCounselInquiry(request(), f.dependencies);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.notification, "unavailable");
  assert.equal(f.rows.size, 1);
});
test("low commitment inquiry does not require destination or professional activation", async () => {
  const f = fixture();
  const response = await receiveCounselInquiry(
    request({ ...payload, intent: "question", destination: "" }),
    f.dependencies,
  );
  assert.equal(response.status, 200);
  assert.equal(f.rows.get(payload.request_id)!.desired_next_step, "question");
});
test("retry with changed facts cannot overwrite receipt", async () => {
  const f = fixture();
  await receiveCounselInquiry(request(), f.dependencies);
  const response = await receiveCounselInquiry(
    request({ ...payload, email: "different@example.com" }),
    f.dependencies,
  );
  assert.equal(response.status, 409);
  assert.equal(f.rows.get(payload.request_id)!.email, payload.email);
});
test("invalid fields, misleading MIME and cross-origin submissions are rejected", async () => {
  const f = fixture();
  assert.equal(
    (
      await receiveCounselInquiry(
        request({ ...payload, email: "wrong" }),
        f.dependencies,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await receiveCounselInquiry(
        request(
          payload,
          new File(["not pdf"], "a.pdf", { type: "application/pdf" }),
        ),
        f.dependencies,
      )
    ).status,
    400,
  );
  const cross = request();
  cross.headers.set("origin", "https://other.example");
  assert.equal(
    (await receiveCounselInquiry(cross, f.dependencies)).status,
    403,
  );
  assert.equal(f.rows.size, 0);
});
test("destination and real attribution are carried without inferred sources", () => {
  assert.equal(
    new URL(
      counselHref("São Tomé and Príncipe"),
      "https://example.com",
    ).searchParams.get("destination"),
    "São Tomé and Príncipe",
  );
  assert.deepEqual(counselAttribution(new URLSearchParams()), {});
  assert.deepEqual(
    counselAttribution(
      new URLSearchParams(
        "source=instagram&campaign=first&payment_status=paid",
      ),
    ),
    { source: "instagram", campaign: "first" },
  );
  assert.equal(
    inquirySchema.safeParse({ ...payload, destination: "" }).success,
    false,
  );
  assert.ok(documentError({ size: 5 * 1024 * 1024, type: "application/pdf" }));
});

test("operational conversion counts require canonical quote and cleared settlement facts", async () => {
  const { counselOperationalFunnel } = await import("@/lib/counsel/funnel");
  const rows = [
    {
      id: "one",
      professional_profile_id: "firm",
      payment_confirmed: true,
      payment_settlement_status: "observed_pending",
    },
    {
      id: "two",
      professional_profile_id: "firm",
      quote_approved_at: "2026-11-07",
      payment_confirmed: true,
      payment_settlement_status: "cleared",
      completed_at: "2026-11-07",
    },
  ];
  assert.deepEqual(counselOperationalFunnel([...rows, rows[1]]), {
    linked_matters: 2,
    reviewed_quotes: 1,
    verified_settlements: 1,
    completed_matters: 1,
    repeat_professional_sources_in_linked_matters: 1,
  });
});


test("private storage is required and metadata failures never confirm document receipt", async () => {
  const file = new File(["%PDF-1.4 test"], "instruction.pdf", { type: "application/pdf" });
  const publicStorage = fixture({ publicBucket: true });
  assert.equal((await receiveCounselInquiry(request(payload, file), publicStorage.dependencies)).status, 503);
  assert.equal(publicStorage.uploads(), 0);
  const metadata = fixture({ metadataFailure: true });
  const response = await receiveCounselInquiry(request(payload, file), metadata.dependencies);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
  assert.equal(metadata.rows.get(payload.request_id)!.details.document_status, "pending");
});
