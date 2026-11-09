import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = Number(process.env.MAP_PROOF_PORT || 3010);
const BASE_URL = process.env.MAP_PROOF_BASE_URL || `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = process.env.MAP_PROOF_DIR || "artifacts/proof/rendered-map";
const START_SERVER = !process.env.MAP_PROOF_BASE_URL;
const ROUTE = "/global-document-intelligence?country=italy";
const COUNTRY_SEQUENCE = ["Italy", "Spain", "Greece", "Argentina", "Colombia"];
const PROFILES = [
  { name: "desktop-1440x900", width: 1440, height: 900, reducedMotion: "no-preference" },
  { name: "desktop-1920x1080", width: 1920, height: 1080, reducedMotion: "no-preference" },
  { name: "mobile-430x932", width: 430, height: 932, reducedMotion: "no-preference" },
  { name: "mobile-390x844", width: 390, height: 844, reducedMotion: "no-preference" },
  { name: "reduced-motion-1440x900", width: 1440, height: 900, reducedMotion: "reduce" },
];

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

// Country controls include a flag in their accessible text. Scope the button
// to its exact country-label descendant; retain the selected-state assertions.
function countryButton(page, country) {
  return page.getByRole("button").filter({ has: page.getByText(country, { exact: true }) }).first();
}

async function clickCountry(page, country) {
  const button = countryButton(page, country);
  await button.waitFor({ state: "visible", timeout: 15_000 });
  await button.click();
}

let server;
let browser;
try {
  await mkdir(ARTIFACT_DIR, { recursive: true });

  if (START_SERVER) {
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(PORT)], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
    });
    server.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
    server.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
    await waitForServer(`${BASE_URL}${ROUTE}`);
  }

  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const results = [];
  let failures = 0;

  for (const profile of PROFILES) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      reducedMotion: profile.reducedMotion,
    });
    // Vercel serves this endpoint only on its hosting platform. Keep local
    // browser proof independent of hosted telemetry; deployed-target proof
    // still loads the real script and retains every application error check.
    if (START_SERVER) {
      await context.route(`${BASE_URL}/_vercel/insights/script.js`, (route) =>
        route.fulfill({ status: 200, contentType: "application/javascript", body: "/* local proof: Vercel telemetry unavailable */" }),
      );
    }
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedResources = [];
    page.on("response", (response) => {
      if (response.status() >= 400) failedResources.push({ status: response.status(), url: response.url() });
    });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`${message.text()} [${message.location().url}]`);
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));

    const response = await page.goto(`${BASE_URL}${ROUTE}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await countryButton(page, "Italy").waitFor({ state: "visible", timeout: 20_000 });

    for (const country of COUNTRY_SEQUENCE.slice(1)) {
      await clickCountry(page, country);
      await page.waitForTimeout(120);
    }

    const finalButton = countryButton(page, "Colombia");
    const latestCountryAuthority = (await finalButton.getAttribute("aria-pressed")) === "true";
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    const horizontalOverflow = overflow.scrollWidth > overflow.clientWidth + 2;
    const bodyText = await page.locator("body").innerText();
    const status = response?.status() ?? 0;
    const missing = status === 404 || /404: This page could not be found|Page Not Found|NOT_FOUND/i.test(bodyText);
    const serverError = status >= 500;
    const reducedMotionEvidence = await page.evaluate(() => {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const active = document.querySelector(".ms-destination-atmosphere-in");
      if (!active) return { media, activeFound: false, animationName: null, animationDuration: null };
      const style = getComputedStyle(active);
      return {
        media,
        activeFound: true,
        animationName: style.animationName,
        animationDuration: style.animationDuration,
      };
    });

    const reducedMotionPassed = profile.reducedMotion !== "reduce" || (
      reducedMotionEvidence.media === true &&
      reducedMotionEvidence.activeFound === true &&
      (reducedMotionEvidence.animationName === "none" || reducedMotionEvidence.animationDuration === "0s")
    );
    const badConsole = consoleErrors.filter((line) => !/favicon|extension/i.test(line));
    const passed = !missing && !serverError && !horizontalOverflow && latestCountryAuthority && reducedMotionPassed && badConsole.length === 0 && pageErrors.length === 0;
    if (!passed) failures += 1;

    const screenshot = `${ARTIFACT_DIR}/${profile.name}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    results.push({
      profile: profile.name,
      status,
      latestCountryAuthority,
      horizontalOverflow,
      reducedMotionEvidence,
      reducedMotionPassed,
      consoleErrors: badConsole,
      failedResources,
      pageErrors,
      passed,
      screenshot,
    });
    console.log(`${passed ? "PASS" : "FAIL"} ${profile.name} status=${status} latestCountry=${latestCountryAuthority} overflow=${horizontalOverflow}`);
    await context.close();
  }

  await browser.close();
  browser = undefined;
  await writeFile(`${ARTIFACT_DIR}/report.json`, JSON.stringify({
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    route: ROUTE,
    countrySequence: COUNTRY_SEQUENCE,
    failures,
    results,
  }, null, 2));

  if (failures > 0) {
    console.error(`Rendered map proof failed: ${failures} viewport profile(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("Rendered map proof green across all exact viewport profiles and reduced-motion mode.");
  }
} finally {
  await browser?.close().catch(() => {});
  if (server && server.exitCode === null && server.signalCode === null) {
    await new Promise((resolve) => {
      const timer = setTimeout(() => { server.kill("SIGKILL"); resolve(); }, 5000);
      server.once("close", () => { clearTimeout(timer); resolve(); });
      server.kill("SIGTERM");
    });
  }
}
