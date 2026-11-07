// Isolated CSR render of the existing operator component with synthetic data.
// This is not a hosted-auth, RLS, provider, or real operator integration test.
const { chromium } = require("playwright");
const esbuild = require("esbuild");
const fs = require("fs");
const http = require("http");
(async () => {
  fs.mkdirSync("work", { recursive: true });
  fs.writeFileSync("work/p2-operator-errors.json", "[]");
  const compiled = await esbuild.build({
    stdin: {
      contents:
        'import React from "react"; import {createRoot} from "react-dom/client"; import Inbox from "./app/dashboard/marketing/counsel/page"; import {ProfessionalMatterForm} from "./components/professional/ProfessionalMatterForm"; import {ProfessionalMatterDashboard} from "./components/professional/ProfessionalMatterDashboard"; const View = location.pathname === "/professional-form" ? ProfessionalMatterForm : location.pathname === "/professional-dashboard" ? ProfessionalMatterDashboard : Inbox; createRoot(document.getElementById("root")).render(<View/>);',
      loader: "tsx",
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const html = await (await fetch("http://localhost:3000/counsel")).text();
  const css = [...html.matchAll(/href="([^" ]+\.css[^" ]*)"/g)]
    .map(
      (match) =>
        `<link rel="stylesheet" href="http://localhost:3000${match[1]}">`,
    )
    .join("");
  const styles = (
    await Promise.all(
      [...html.matchAll(/href="([^" ]+\.css[^" ]*)"/g)].map((match) =>
        fetch("http://localhost:3000" + match[1]).then((r) => r.text()),
      ),
    )
  ).join("\n");
  const server = http.createServer((request, response) => {
    if (request.url === "/styles.css") {
      response.writeHead(200, { "Content-Type": "text/css" });
      return response.end(styles);
    }
    if (request.url === "/bundle.js") {
      response.writeHead(200, { "Content-Type": "text/javascript" });
      response.end(compiled.outputFiles[0].contents);
    } else {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(
        `<!doctype html><html><head><link rel="stylesheet" href="/styles.css"></head><body style="background:#090909"><div id="root"></div><script>globalThis.process={env:{NODE_ENV:"production"},browser:true};</script><script src="/bundle.js"></script></body></html>`,
      );
    }
  });
  await new Promise((resolve) => server.listen(4177, "127.0.0.1", resolve));
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
    fs.writeFileSync("work/p2-operator-errors.json", JSON.stringify(errors));
  });
  const reference = "126a94a2-83f0-4a10-b42e-ed0880a2dfb7",
    profileId = "27c94d41-8ed6-4e6b-a651-210c80220f65";
  const lead = {
    id: reference,
    full_name: "Synthetic Counsel With a Long Professional Name",
    email: "long.professional.counsel.email.address@example.com",
    country: "Saint Vincent and the Grenadines",
    created_at: "2026-11-07T10:00:00Z",
    canonical_matter_id: null,
    details: {
      firm: "Synthetic International Legal Advisory and Private Client Partnership",
      summary:
        "Synthetic review request only; no real client or document data.",
      destination: "Italy",
      document_status: "pending",
      attribution: { source: "instagram" },
    },
    acquisition: {
      stage: "NEW",
      age_hours: 1,
      response_evidence: "none",
      next_action: "Review and respond",
      professional_profile_id: null,
      activation_opportunity: false,
      repeat_opportunity: false,
      last_operator_action: null,
    },
  };
  const profile = {
    id: profileId,
    email: lead.email,
    firm_name: lead.details.firm,
    status: "prospect",
  };
  let failedOnce = false;
  const payloads = [];
  await page.route("**/api/admin/counsel*", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      payloads.push(body);
      if (!failedOnce) {
        failedOnce = true;
        return route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Synthetic persistence failure; retry retained.",
          }),
        });
      }
      lead.acquisition.stage =
        body.operator_action?.kind === "qualify" ? "QUALIFIED" : "RESPONDED";
      lead.acquisition.response_evidence = "operator_attested";
      if (body.operator_action?.kind === "qualify") {
        lead.acquisition.professional_profile_id = profileId;
        lead.acquisition.activation_opportunity = true;
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        inquiries: [lead],
        notifications: [
          {
            id: "qa-notification",
            status: "failed",
            delivery_status: "failed",
            error_message: "SYNTHETIC_PROVIDER_FAILURE",
            metadata: { inquiry_reference: reference },
          },
        ],
        professional_profiles: [profile],
        operational: { linked_matters: 0 },
        acquisition: {
          new_today: 1,
          awaiting_response: 1,
          qualified: 0,
          uploads_pending: 1,
          documents_received: 0,
          follow_ups_due: 0,
          sources: { instagram: 1 },
        },
        marketing: { counsel_visit: 2 },
        marketing_scope: "Synthetic observations",
        notification_failures: 1,
      }),
    });
  });
  await page.route("**/api/admin/professionals", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ profiles: [profile] }),
    }),
  );
  await page.route(
    `**/api/admin/professionals/${profileId}/activate`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, status: "active" }),
      }),
  );
  await page.goto("http://127.0.0.1:4177/", { waitUntil: "networkidle" });
  await page
    .getByText(lead.full_name + " · " + lead.details.firm, { exact: true })
    .waitFor()
    .catch(async (error) => {
      fs.writeFileSync(
        "work/p2-operator-debug.txt",
        await page.locator("body").innerText(),
      );
      throw error;
    });
  const results = [];
  for (const width of [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    results.push({ width, overflow });
    if (overflow) throw Error("Operator overflow at " + width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText("Record operator action", { exact: true }).click();
  await page.locator("select[name=kind]").selectOption("respond");
  await page
    .getByLabel("Operator note (required)")
    .fill("Synthetic completed call for browser QA only.");
  await page
    .getByLabel("Next action", { exact: true })
    .fill("Review synthetic context");
  await page.getByLabel("Completed response channel").selectOption("phone");
  await page
    .getByLabel("Response evidence reference (required for response)")
    .fill("Synthetic call reference");
  await page.getByRole("button", { name: "Save evidenced action" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Synthetic persistence failure" })
    .waitFor();
  await page.getByRole("button", { name: "Save evidenced action" }).click();
  await page.getByText(/RESPONDED/).waitFor();
  if (payloads[0].operator_action.id !== payloads[1].operator_action.id)
    throw Error("Action retry ID changed");
  await page.route("**/api/professional/profile", async (route) => {
    const payload = route.request().postDataJSON();
    if (
      payload.email !== lead.email ||
      "role" in payload ||
      "status" in payload
    )
      throw Error("Prospect creation changed identity authority");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page
    .getByRole("button", {
      name: "Create prospect through existing profile workflow",
    })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: /No account has been activated/ })
    .waitFor();
  await page
    .getByRole("button", { name: "Find existing professional profile" })
    .click();
  await page.locator("select[name=kind]").selectOption("qualify");
  await page
    .getByLabel(
      "Existing professional profile UUID (required for qualification)",
    )
    .fill(profileId);
  await page.getByRole("button", { name: "Save evidenced action" }).click();
  await page
    .getByRole("button", {
      name: "Invite through existing Professional Access",
    })
    .waitFor();
  await page
    .getByRole("button", {
      name: "Invite through existing Professional Access",
    })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: /Canonical professional activation completed/ })
    .waitFor();
  await page.screenshot({
    path: "work/p2-operator-mobile-mocked.png",
    fullPage: true,
  });
  await page.route("**/api/professional/account", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: { firm_name: "Synthetic Firm", email: "qa@example.com" },
        defaults: {
          preferred_destination_countries: ["Italy"],
          default_receiving_authority: "Prior recipient",
          preferred_execution_method: "ron_when_eligible",
          default_client_handoff_mode: "professional_submits",
        },
      }),
    }),
  );
  await page.goto("http://127.0.0.1:4177/professional-form", {
    waitUntil: "networkidle",
  });
  if (await page.locator("#matter-destination").inputValue())
    throw Error("Destination carried forward");
  if (await page.locator("#matter-authority").inputValue())
    throw Error("Authority carried forward");
  await page
    .locator("#matter-client-name")
    .fill("Synthetic Client With a Long International Professional Name");
  await page
    .locator("#matter-client-email")
    .fill("long.synthetic.client.email.address@example.com");
  for (const width of [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    results.push({ surface: "professional_form", width, overflow });
    if (overflow) throw Error("Professional form overflow at " + width);
  }
  await page
    .getByRole("button", { name: "Submit Client Matter", exact: true })
    .click();
  await page.getByText(/Confirm that you have checked/).waitFor();
  await page.getByLabel("Client completes secure intake").check();
  await page.getByLabel(/I have checked this Matter/).check();
  await page.route("**/api/professional/handoff", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: "http://localhost:3000/intake?lane=professional&pro=synthetic&ref=synthetic-fixture",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Create Secure Intake Link", exact: true })
    .click();
  await page.getByText(/Secure intake link ready/).waitFor();
  await page.locator("#matter-destination").fill("Spain");
  if (await page.getByLabel("Secure client intake link").count())
    throw Error("Stale handoff link remained after destination changed");
  if (await page.getByLabel(/I have checked this Matter/).isChecked())
    throw Error("Reconfirmation remained after facts changed");
  await page.route("**/api/professional/matters", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        matters: [
          {
            id: "qa",
            matterReference: "QA-ONLY",
            client: "Synthetic",
            destination: "Italy",
            document: "Affidavit",
            stage: "Completed",
            nextAction: "Start another Matter",
            completed: true,
          },
        ],
      }),
    }),
  );
  await page.goto("http://127.0.0.1:4177/professional-dashboard", {
    waitUntil: "networkidle",
  });
  await page
    .getByRole("link", { name: "Start another Matter", exact: true })
    .waitFor();
  for (const width of [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    results.push({ surface: "professional_dashboard", width, overflow });
    if (overflow) throw Error("Professional dashboard overflow at " + width);
  }
  fs.writeFileSync(
    "work/p2-operator-browser-results.json",
    JSON.stringify(
      {
        results,
        errors,
        notes: [
          "Isolated existing operator component, synthetic responses; not hosted auth/RLS/provider certification.",
        ],
      },
      null,
      2,
    ),
  );
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  if (errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
