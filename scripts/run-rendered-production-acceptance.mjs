import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = (process.env.MILANO_RENDERED_BASE_URL || "https://www.themilanoseal.com").replace(/\/$/, "");
const productionBaseUrl = (process.env.MILANO_PRODUCTION_BASE_URL || "https://www.themilanoseal.com").replace(/\/$/, "");
const localRun = ["localhost", "127.0.0.1"].includes(new URL(baseUrl).hostname);
const outputDir = path.resolve("artifacts/proof/rendered-production");
fs.mkdirSync(outputDir, { recursive: true });

const profiles = [
  { name: "iphone-320", width: 320, height: 780, mobile: true },
  { name: "iphone-360", width: 360, height: 800, mobile: true },
  { name: "iphone-375", width: 375, height: 812, mobile: true },
  { name: "iphone-390", width: 390, height: 844, mobile: true },
  { name: "iphone-412", width: 412, height: 915, mobile: true },
  { name: "iphone-430", width: 430, height: 932, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: false },
  { name: "desktop-1024", width: 1024, height: 900, mobile: false },
  { name: "desktop-1280", width: 1280, height: 900, mobile: false },
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
];

const routes = [
  { path: "/", expect: /The Milano Seal|Begin Secure Intake/i, home: true },
  {
    path: "/speak-with-nicholas",
    query: "?service_intent=apostille&destination=Italy&audience=professional&urgency=urgent&source=search&medium=organic&campaign=rendered-test&content=hero&originating_page=%2Fservices%2Fapostille",
    expect: /Speak With Nicholas|Request a conversation/i,
    concierge: true,
  },
  { path: "/intake", expect: /Secure Records Intake|Begin Your Execution/i },
  { path: "/global-document-intelligence", expect: /Execution Intelligence|Global Document Intelligence|Country Directory/i, map: true },
  { path: "/professional/damiani", expect: /Damiani|Bentornata|pratica/i },
  { path: "/secure-portal", expect: /Secure Matter Portal|portal|sign in|login/i, hosted: true },
  { path: "/services/apostille", expect: /Apostille Coordination|Competent Authority Routing/i },
];

const results = [];
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      isMobile: profile.mobile,
      hasTouch: profile.mobile,
      reducedMotion: "reduce",
    });

    if (localRun) await context.route("**/_vercel/insights/script.js", request => request.fulfill({ status: 200, contentType: "application/javascript", body: "/* Local fixture: Vercel analytics runtime is not served by next start. */" }));
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("milano_ritual_home_seen", "1");
        sessionStorage.setItem("milano_ritual_seen", "1");
      } catch {}
    });

    for (const route of routes) {
      const page = await context.newPage();
      const errors = [];
      const conciergeRequests = [];
      let expectedConciergeFailure = false;

      page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
      page.on("response", (response) => {
        if (response.status() < 400) return;
        const url = new URL(response.url());
        if (route.concierge && expectedConciergeFailure && response.status() === 503 && url.pathname === "/api/concierge") return;
        if (localRun && url.pathname === "/_vercel/insights/script.js") return;
        errors.push(`response ${response.status()}: ${response.url()}`);
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();

        if (route.concierge && expectedConciergeFailure && text.startsWith("Failed to load resource: the server responded with a status of 503")) {
          const location = message.location().url;
          if (location && new URL(location).origin === new URL(baseUrl).origin && new URL(location).pathname === "/api/concierge") return;
        }
        errors.push(`console: ${text}`);
      });
      page.on("requestfailed", (request) => {
        const url = request.url();
        // Next intentionally cancels speculative RSC prefetches as viewport
        // links change. Only a positively identified cancelled prefetch is not
        // an application transport failure; navigation/API/asset failures stay fatal.
        if (request.failure()?.errorText === "net::ERR_ABORTED"
          && request.headers()["next-router-prefetch"] === "1"
          && new URL(url).searchParams.has("_rsc")) return;
        errors.push(`requestfailed: ${url} ${request.failure()?.errorText || ""}`);
      });

      const routeBaseUrl = route.hosted ? productionBaseUrl : baseUrl;
      const response = await page.goto(`${routeBaseUrl}${route.path}${route.query || ""}`, {
        waitUntil: "networkidle",
        timeout: 90000,
      });

      assert.ok(response, `${profile.name} ${route.path}: no navigation response`);
      assert.ok((response?.status() ?? 500) < 500, `${profile.name} ${route.path}: server error ${response?.status()}`);

      await page.locator("body").waitFor({ state: "visible", timeout: 15000 });
      const bodyText = await page.locator("body").innerText();
      assert.match(bodyText, route.expect, `${profile.name} ${route.path}: expected production copy missing`);
      assert.doesNotMatch(bodyText, /404: This page could not be found|Application error|Internal Server Error/i);

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      assert.equal(overflow, false, `${profile.name} ${route.path}: horizontal overflow`);

      const brokenImages = await page.evaluate(() =>
        Array.from(document.images)
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.currentSrc || img.src)
      );
      assert.deepEqual(brokenImages, [], `${profile.name} ${route.path}: broken images: ${brokenImages.join(", ")}`);

      if (route.home) {
        const intakeLinks = page.getByRole("link", { name: /Start Your Request|Begin Secure Intake|Start Secure Intake/i });
        assert.ok(await intakeLinks.count(), `${profile.name}: homepage intake CTA missing`);
        assert.ok(await page.getByRole("link", { name: /Get Pricing/i }).count(), `${profile.name}: homepage pricing CTA missing`);
        assert.ok(await page.getByRole("link", { name: /Speak With Nicholas/i }).count(), `${profile.name}: homepage concierge CTA missing`);
      }

      if (route.map) {
        await page.locator(".leaflet-container").first().waitFor({ state: "visible", timeout: 30000 });
        assert.equal(await page.locator(".leaflet-container").first().isVisible(), true);
      }

      if (route.concierge) {
        const name = page.locator('input[name="full_name"]');
        const email = page.locator('input[name="email"]');
        const submit = page.getByRole("button", { name: /Request a conversation/i });
        assert.equal(await page.locator('select[name="service_intent"]').inputValue(), "apostille");
        assert.equal(await page.locator('input[name="destination"]').inputValue(), "Italy");
        assert.equal(await page.locator('select[name="audience"]').inputValue(), "professional");
        assert.equal(await page.locator('select[name="urgency"]').inputValue(), "urgent");
        assert.equal(await name.getAttribute("autocomplete"), "name");
        assert.equal(await email.getAttribute("autocomplete"), "email");

        await submit.click();
        assert.equal(await name.evaluate((input) => input.validity.valid), false);
        const nameBox = await name.boundingBox();
        assert.ok(nameBox && nameBox.y >= 0 && nameBox.y < profile.height, `${profile.name}: invalid field should scroll into view`);

        await name.fill("Maria Rossi");
        await email.fill("not-an-email");
        await submit.click();
        assert.equal(await email.evaluate((input) => input.validity.valid), false);

        await email.fill("maria@example.com");
        await page.locator('textarea[name="question"]').fill("I need help deciding what this apostille request requires.");
        await page.route("**/api/concierge", async (requestRoute) => {
          const submitted = requestRoute.request().postDataJSON();
          conciergeRequests.push(submitted);
          if (conciergeRequests.length <= 2) {
            await requestRoute.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Please retry." }) });
            return;
          }
          await requestRoute.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, reference: submitted.request_id, notification: "unavailable" }) });
        });

        expectedConciergeFailure = true;
        await submit.click();
        await page.locator("#concierge-form-error[role=alert]").waitFor({ state: "visible" });
        await page.waitForFunction(() => document.activeElement?.id === "concierge-form-error");
        expectedConciergeFailure = false;
        assert.equal(await name.inputValue(), "Maria Rossi");
        assert.equal(await page.evaluate(() => document.activeElement?.id), "concierge-form-error");
        assert.equal(await page.locator("form").getAttribute("aria-describedby"), "concierge-form-error");
        expectedConciergeFailure = true;
        await submit.click();
        await page.waitForFunction(() => document.activeElement?.id === "concierge-form-error");
        expectedConciergeFailure = false;
        assert.equal(await email.inputValue(), "maria@example.com");
        assert.equal(await page.locator('textarea[name="question"]').inputValue(), "I need help deciding what this apostille request requires.");
        await submit.click();
        await page.getByRole("heading", { name: "Your inquiry is recorded." }).waitFor({ state: "visible" });
        assert.equal(conciergeRequests.length, 3);
        assert.equal(conciergeRequests[1].request_id, conciergeRequests[2].request_id);
        assert.equal(conciergeRequests[0].request_id, conciergeRequests[1].request_id);
        assert.equal(conciergeRequests[1].service_intent, "apostille");
        assert.equal(conciergeRequests[1].destination, "Italy");
        assert.equal(conciergeRequests[1].originating_page, "/services/apostille");
        assert.equal(conciergeRequests[1].attribution.campaign, "rendered-test");
        await page.waitForFunction(() => document.activeElement?.textContent?.includes("Your inquiry is recorded."));
        assert.match(await page.locator("body").innerText(), /An operator email alert could not be confirmed/);
      }

      assert.deepEqual(errors, [], `${profile.name} ${route.path}: client errors:\n${errors.join("\n")}`);

      const slug = route.path === "/" ? "home" : route.path.replace(/^\//, "").replace(/\//g, "-");
      await page.screenshot({
        path: path.join(outputDir, `${profile.name}-${slug}.png`),
        fullPage: true,
      });

      const performanceMeasurement = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return navigation ? {ttfb_ms:navigation.responseStart-navigation.requestStart,dom_content_loaded_ms:navigation.domContentLoadedEventEnd,load_event_ms:navigation.loadEventEnd,transfer_bytes:navigation.transferSize} : null;
      });
      results.push({ performanceMeasurement, performanceScope: localRun ? 'LOCAL_LAB_NOT_FIELD_CERTIFICATION' : 'HOSTED_LAB_NOT_FIELD_CERTIFICATION', profile: profile.name, width: profile.width, route: route.path, finalUrl: page.url(), status: response.status(), consolePageNetworkErrors: errors, conciergeMock: Boolean(route.concierge), hosted: Boolean(route.hosted) });
      console.log(`PASS ${profile.name} ${route.path}`);
      await page.close();
    }

    await context.close();
  }
} finally {
  fs.writeFileSync(path.join(outputDir, "results.json"), JSON.stringify({ baseUrl, productionBaseUrl, expectedChecks: profiles.length * routes.length, passedChecks: results.length, results }, null, 2));
  await browser.close();
}

console.log("PASS full rendered production acceptance");
