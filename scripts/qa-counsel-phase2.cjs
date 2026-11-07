// LOCAL Chromium QA. Operational API responses below are explicit synthetic mocks.
const { chromium } = require("playwright");
const fs = require("fs");
(async () => {
  fs.mkdirSync("work", { recursive: true });
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const results = [],
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const slugs = [
    "private-client",
    "immigration-nationality",
    "citizenship",
    "international-real-estate",
    "trusts-estates",
    "private-wealth",
    "corporate",
    "cross-border-family",
    "litigation-support",
    "maritime-yacht",
  ];
  const corridors = [
    "italy",
    "spain",
    "portugal",
    "greece",
    "brazil",
    "mexico",
    "france",
    "germany",
    "uae",
    "switzerland",
  ];
  for (const path of [
    "/counsel/corridors",
    "/counsel/use-cases",
    ...slugs.map((slug) => `/counsel/use-cases/${slug}`),
    ...corridors.map((slug) => `/professional/${slug}`),
  ]) {
    await page.goto(
      `http://localhost:3000${path}?source=instagram&medium=social&campaign=qa&content=first`,
      { waitUntil: "networkidle" },
    );
    await page.locator("h1").waitFor();
    const canonical = await page
      .locator("link[rel=canonical]")
      .getAttribute("href");
    if (!canonical.endsWith(path)) throw Error("Wrong canonical for " + path);
    const structured = (
      await page.locator('script[type="application/ld+json"]').allTextContents()
    ).join(" ");
    if (
      /Attorney"|LegalService|qa-private|professional_profile_id/.test(
        structured,
      )
    )
      throw Error("Private or legal-service metadata on " + path);
    for (const width of [320, 360, 375, 390, 412, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )
      )
        throw Error("Overflow " + path + " at " + width);
      results.push({ path, width, overflow: false });
    }
    if (
      path === "/professional/uae" ||
      path === "/counsel/use-cases/private-client"
    )
      await page.screenshot({
        path: `work/p2-${path.split("/").pop()}-desktop.png`,
        fullPage: true,
      });
    if (path.startsWith("/professional/") || path.includes("/use-cases/")) {
      const target = await page
        .getByRole("link", { name: /Send a U.S. Matter/ })
        .first()
        .getAttribute("href");
      if (
        !target.includes("campaign=qa") ||
        !target.includes("source=instagram")
      )
        throw Error("Campaign lost at " + path);
      if (path.startsWith("/professional/") && !target.includes("destination="))
        throw Error("Destination lost");
      if (path.includes("/use-cases/") && !target.includes("practice_area="))
        throw Error("Practice context lost");
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    "http://localhost:3000/counsel/use-cases/private-client?source=instagram&campaign=first",
    { waitUntil: "networkidle" },
  );
  await page
    .getByRole("link", { name: "Send a U.S. Matter", exact: true })
    .click();
  await page.getByText(/Professional context: International/).waitFor();
  await page.screenshot({ path: "work/p2-context-mobile.png", fullPage: true });
  fs.writeFileSync(
    "work/p2-browser-results.json",
    JSON.stringify(
      {
        results,
        errors,
        notes: [
          "Professional account, referral and Matter browser responses are synthetic mocks. Real auth and signed referral verification remain separately tested or unverified.",
          "Chromium does not certify native mobile keyboard behavior.",
        ],
      },
      null,
      2,
    ),
  );
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
