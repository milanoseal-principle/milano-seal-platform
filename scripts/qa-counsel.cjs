// Run against a LOCAL dev server only. Success responses are explicitly mocked.
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  fs.mkdirSync("work", { recursive: true });
  const results = [];
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      "http://localhost:3000/counsel?source=instagram&campaign=qa&destination=italy",
      { waitUntil: "networkidle" },
    );
    await page
      .getByRole("heading", { name: /Your U.S. execution desk/ })
      .waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    const hero = await page.locator("h1").boundingBox();
    results.push({
      width,
      overflow,
      heroVisible: hero.y < 900,
      primaryCTA: await page
        .locator(".counsel-hero .counsel-actions .counsel-button")
        .isVisible(),
    });
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `work/counsel-${width}.png`,
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".counsel-hero .counsel-actions .counsel-button").click();
  if (await page.locator(".counsel-mobile-action").count())
    throw Error("mobile action remained over form");
  await page
    .getByRole("button", { name: "Request U.S. execution review" })
    .click();
  if (
    await page
      .locator("#counsel-full_name")
      .evaluate((el) => el !== document.activeElement)
  )
    throw Error("first error not focused");
  await page.getByLabel("Name", { exact: true }).fill("Maria Rossi");
  await page
    .getByLabel("Firm / organization", { exact: true })
    .fill(
      "International Private Client Counsel and Corporate Legal Advisory Partnership With a Very Long Name",
    );
  await page
    .getByLabel("Your country", { exact: true })
    .fill("Saint Vincent and the Grenadines");
  await page
    .getByLabel("Professional email", { exact: true })
    .fill("long.professional.email.address.for.counsel@example.com");
  await page
    .getByLabel("What does your client need executed?")
    .fill(
      "Our client in the United States needs a power of attorney executed for use in Italy.",
    );
  await page.route("**/api/counsel", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        ok: false,
        error: "Document upload failed. Please retry.",
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Request U.S. execution review" })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Document upload failed" })
    .waitFor();
  if (!(await page.getByLabel("Name", { exact: true }).inputValue()))
    throw Error("retry lost fields");
  for (const width of [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error("filled form overflow at " + width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.unroute("**/api/counsel");
  let captured;
  await page.route("**/api/counsel", async (route) => {
    captured = route.request().postData();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        reference: "b628ed63-a1ed-4603-8094-c10acc105b84",
        destination: "Italy",
        email: "long.professional.email.address.for.counsel@example.com",
        document_status: "not_provided",
      }),
    });
  });
  await page
    .getByRole("button", { name: "Request U.S. execution review" })
    .click();
  await page
    .getByRole("heading", { name: "Your Matter is with Milano." })
    .waitFor();
  if (!captured.includes("instagram") || !captured.includes("Italy"))
    throw Error("attribution/destination missing");
  await page.screenshot({ path: "work/counsel-success.png", fullPage: true });
  await page.unroute("**/api/counsel");
  await page.goto("http://localhost:3000/counsel", {
    waitUntil: "networkidle",
  });
  await page.locator(".counsel-hero .counsel-actions .counsel-text-link").click();
  if (await page.getByLabel("Destination country", { exact: true }).count())
    throw Error("question asks destination");
  await page.getByLabel("Name", { exact: true }).fill("Ana Counsel");
  await page
    .getByLabel("Firm / organization", { exact: true })
    .fill("Counsel firm");
  await page.getByLabel("Your country", { exact: true }).fill("Portugal");
  await page
    .getByLabel("Professional email", { exact: true })
    .fill("ana@example.com");
  await page
    .getByLabel("Your question", { exact: true })
    .fill("Can you coordinate execution for a client in Florida?");
  await page.route("**/api/counsel", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        reference: "b628ed63-a1ed-4603-8094-c10acc105b84",
        email: "ana@example.com",
        document_status: "not_provided",
      }),
    }),
  );
  await page.getByRole("button", { name: "Send your question" }).click();
  await page
    .getByRole("heading", { name: "Your question is with Milano." })
    .waitFor();
  await page.unroute("**/api/counsel");
  await page.goto("http://localhost:3000/counsel", {
    waitUntil: "networkidle",
  });
  await page.getByLabel("Name", { exact: true }).fill("Unsaved draft");
  await page.reload({ waitUntil: "networkidle" });
  if (await page.getByLabel("Name", { exact: true }).inputValue())
    throw Error("sensitive draft persisted");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".counsel-hero .counsel-actions .counsel-button").click();
  await page.keyboard.press("Tab");
  await page.locator(".counsel-upload summary").click();
  await page
    .locator("#counsel-document")
    .setInputFiles({
      name: "wrong.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("test"),
    });
  await page
    .getByText("Choose a PDF, JPEG or PNG document.", { exact: true })
    .waitFor();
  await page
    .locator("#counsel-document")
    .setInputFiles({
      name: "execution.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 synthetic QA"),
    });
  await page.getByLabel("Name", { exact: true }).fill("Document Counsel");
  await page
    .getByLabel("Firm / organization", { exact: true })
    .fill("QA Counsel");
  await page.getByLabel("Your country", { exact: true }).fill("Italy");
  await page
    .getByLabel("Professional email", { exact: true })
    .fill("document@example.com");
  await page.getByLabel("Destination country", { exact: true }).fill("Italy");
  await page
    .getByLabel("What does your client need executed?")
    .fill("A synthetic document for local browser testing only.");
  await page.route("**/api/counsel", (route) => {
    const data = route.request().postDataBuffer();
    if (!data.includes(Buffer.from("execution.pdf")))
      throw Error("file not sent");
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        reference: "b628ed63-a1ed-4603-8094-c10acc105b84",
        destination: "Italy",
        email: "document@example.com",
        document_status: "received",
      }),
    });
  });
  await page
    .getByRole("button", { name: "Request U.S. execution review" })
    .click();
  await page.getByText("Received securely", { exact: true }).waitFor();
  await page.unroute("**/api/counsel");
  const real = await page.request.post("http://localhost:3000/api/counsel", {
    multipart: {
      inquiry: JSON.stringify({
        request_id: "b628ed63-a1ed-4603-8094-c10acc105b84",
        intent: "question",
        full_name: "QA Counsel",
        firm: "QA",
        country: "Italy",
        email: "qa@example.com",
        summary: "Local blocked-path verification only.",
      }),
    },
  });
  results.push({
    realMissingCredentialsStatus: real.status(),
    realMissingCredentialsBody: await real.json(),
    note: "Successful UI receipts above used explicit Playwright response mocks, not a live database.",
  });
  fs.writeFileSync(
    "work/browser-results.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser.close();
  if (results.some((r) => r.overflow) || errors.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
