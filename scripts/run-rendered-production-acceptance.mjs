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
  { name: "iphone-390", width: 390, height: 844, mobile: true },
  { name: "iphone-430", width: 430, height: 932, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: false },
  { name: "desktop-1440", width: 1440, height: 900, mobile: false },
];

const routes = [
  { path: "/", expect: /The Milano Seal|Begin Secure Intake/i, home: true },
  { path: "/intake", expect: /Secure Records Intake|Begin Your Execution/i },
  { path: "/global-document-intelligence", expect: /Execution Intelligence|Global Document Intelligence|Country Directory/i, map: true },
  { path: "/professional/damiani", expect: /Damiani|Bentornata|pratica/i },
  { path: "/secure-portal", expect: /Secure Matter Portal|portal|sign in|login/i, hosted: true },
  { path: "/services/apostille", expect: /Apostille Coordination|Competent Authority Routing/i },
];

const browser = await chromium.launch({ headless: true });

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      isMobile: profile.mobile,
      hasTouch: profile.mobile,
      reducedMotion: "reduce",
    });

    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("milano_ritual_home_seen", "1");
        sessionStorage.setItem("milano_ritual_seen", "1");
      } catch {}
    });

    for (const route of routes) {
      const page = await context.newPage();
      const errors = [];

      page.on("pageerror", (error) => errors.push(`pageerror: ${error.stack || error.message}`));
      page.on("response", (response) => {
        if (response.status() < 400) return;
        const url = new URL(response.url());
        if (localRun && url.pathname === "/_vercel/insights/script.js") return;
        errors.push(`response ${response.status()}: ${response.url()}`);
        if (response.status() >= 400) errors.push(`response ${response.status()}: ${response.url()}`);
      });
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (text.startsWith("Failed to load resource: the server responded with a status of 404")) return;
        errors.push(`console: ${text}`);
      });
      page.on("requestfailed", (request) => {
        const url = request.url();
        if (url.includes("/_next/") || url.includes("/world.geojson") || url.includes("/brand/")) {
          errors.push(`requestfailed: ${url} ${request.failure()?.errorText || ""}`);
        }
      });

      const routeBaseUrl = route.hosted ? productionBaseUrl : baseUrl;
      const response = await page.goto(`${routeBaseUrl}${route.path}`, {
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

      assert.deepEqual(errors, [], `${profile.name} ${route.path}: client errors:\n${errors.join("\n")}`);

      const slug = route.path === "/" ? "home" : route.path.replace(/^\//, "").replace(/\//g, "-");
      await page.screenshot({
        path: path.join(outputDir, `${profile.name}-${slug}.png`),
        fullPage: true,
      });

      console.log(`PASS ${profile.name} ${route.path}`);
      await page.close();
    }

    await context.close();
  }
} finally {
  await browser.close();
}

console.log("PASS full rendered production acceptance");
