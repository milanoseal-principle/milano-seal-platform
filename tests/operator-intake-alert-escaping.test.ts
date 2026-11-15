import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { escapeHtml, operatorIntakeAlertHtml } from "@/lib/notifications/transactionalEmailAlerts";

// The new-Matter alert to nicholas@themilanoseal.com rendered client-entered intake fields as raw
// HTML, so a submitted name or destination could inject links or markup into the founder's inbox.

test("client-entered intake fields are escaped in the founder's new-Matter alert", () => {
  const html = operatorIntakeAlertHtml({
    matterId: "m1",
    matterReference: "MS-2026-0001",
    clientName: '<a href="https://evil.example">Verify payment</a>',
    clientEmail: "x@example.invalid\"><img src=x onerror=alert(1)>",
    documentType: "<script>alert(1)</script>",
    destination: "Italy & 'Vatican'",
    finalTotal: 200,
    amountDue: 200,
    currency: "USD",
  });
  assert.doesNotMatch(html, /<a href="https:\/\/evil|<img|<script/);
  assert.match(html, /&lt;a href=&quot;https:\/\/evil\.example&quot;&gt;Verify payment&lt;\/a&gt;/);
  assert.match(html, /Italy &amp; &#39;Vatican&#39;/);
  assert.match(html, /<strong>MS-2026-0001<\/strong>/);
  assert.match(html, /Not provided|Client: &lt;a/);
  assert.equal(escapeHtml(null), "");
});

test("outreach templates sign with the company's real domain", () => {
  for (const file of ["app/dashboard/outreach/page.tsx", "lib/notifications/transactionalEmailAlerts.ts"]) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /themillanoseal\.com/i, file);
  }
});
