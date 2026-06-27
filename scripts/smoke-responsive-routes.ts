#!/usr/bin/env node

import { createRequire } from "node:module";

type SmokeRoute = {
  path: string;
  label: string;
  requireCta?: boolean;
};

type ViewportCase = {
  width: number;
  height: number;
  label: string;
};

const require = createRequire(import.meta.url);

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const STRICT = process.env.RESPONSIVE_SMOKE_STRICT === "1";

const ROUTES: SmokeRoute[] = [
  { path: "/", label: "Homepage", requireCta: true },
  { path: "/countries", label: "Countries", requireCta: true },
  { path: "/apostille/italy", label: "Italy apostille", requireCta: true },
  { path: "/apostille/uae", label: "UAE apostille", requireCta: true },
  { path: "/map?country=italy", label: "Atlas Italy", requireCta: true },
  { path: "/intake?destination=italy", label: "Intake Italy", requireCta: false },
  { path: "/review", label: "Review", requireCta: false },
];

const VIEWPORTS: ViewportCase[] = [
  { width: 390, height: 900, label: "mobile" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 900, height: 900, label: "split-screen" },
  { width: 1024, height: 900, label: "laptop" },
  { width: 1280, height: 900, label: "desktop" },
  { width: 1440, height: 960, label: "wide" },
];

const ZOOM_LEVELS = [0.9, 1, 1.25, 1.5];

function loadPlaywright(): any | null {
  try {
    return require("playwright");
  } catch {
    return null;
  }
}

async function serverIsReachable(): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL, { redirect: "manual" });
    return response.status < 500;
  } catch {
    return false;
  }
}

function skipOrFail(message: string): never {
  if (STRICT) {
    console.error(`✗ ${message}`);
    process.exit(1);
  }

  console.warn(`— SKIP: ${message}`);
  process.exit(0);
}

async function main() {
  if (!(await serverIsReachable())) {
    skipOrFail(`No reachable server at ${BASE_URL}. Start Next.js first or set BASE_URL.`);
  }

  const playwright = loadPlaywright();

  if (!playwright) {
    skipOrFail("Playwright is not installed. Responsive smoke not run.");
  }

  const browser = await playwright.chromium.launch({ headless: true });
  const failures: string[] = [];

  try {
    for (const viewport of VIEWPORTS) {
      for (const zoom of ZOOM_LEVELS) {
        const context = await browser.newContext({
          viewport: {
            width: viewport.width,
            height: viewport.height,
          },
        });

        const page = await context.newPage();

        for (const route of ROUTES) {
          const url = new URL(route.path, BASE_URL).toString();

          const response = await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 45_000,
          });

          if (!response || response.status() >= 500) {
            failures.push(
              `${route.label} ${viewport.label} ${zoom}x returned ${response?.status() ?? "no response"}`,
            );
            continue;
          }

          await page.addStyleTag({
            content: `html { zoom: ${zoom}; }`,
          });

          await page.waitForTimeout(350);

          const h1Visible = await page
            .locator("h1")
            .first()
            .isVisible()
            .catch(() => false);

          if (!h1Visible) {
            failures.push(`${route.label} ${viewport.label} ${zoom}x has no visible h1`);
          }

          if (route.requireCta) {
            const ctaVisible = await page
              .locator(
                'a:has-text("Begin Secure Intake"), a:has-text("Start Secure Intake"), button:has-text("Begin Secure Intake"), button:has-text("Start Secure Intake")',
              )
              .first()
              .isVisible()
              .catch(() => false);

            if (!ctaVisible) {
              failures.push(`${route.label} ${viewport.label} ${zoom}x has no visible primary CTA`);
            }
          }

          const pageFailures = await page.evaluate(async () => {
            const problems: string[] = [];

            if (document.documentElement.scrollWidth > window.innerWidth + 2) {
              const allowed = document.querySelector("[data-allow-horizontal-scroll]");
              if (!allowed) {
                problems.push("unexpected horizontal overflow");
              }
            }

            const headerTotal = Number.parseFloat(
              getComputedStyle(document.documentElement)
                .getPropertyValue("--header-total-height")
                .trim() || "0",
            );

            const criticalCards = Array.from(
              document.querySelectorAll<HTMLElement>("[data-critical-card]"),
            );

            for (let index = 0; index < criticalCards.length; index += 1) {
              const card = criticalCards[index];

              card.scrollIntoView({
                block: "center",
                inline: "nearest",
              });

              await new Promise((resolve) => requestAnimationFrame(resolve));

              const rect = card.getBoundingClientRect();
              const style = window.getComputedStyle(card);

              if (style.display === "none" || style.visibility === "hidden") {
                problems.push(`critical card ${index} hidden`);
              }

              if (rect.width <= 0 || rect.height <= 0) {
                problems.push(`critical card ${index} has zero size`);
              }

              if (rect.left < -2 || rect.right > window.innerWidth + 2) {
                problems.push(`critical card ${index} outside horizontal viewport`);
              }

              if (rect.top < -2 || rect.bottom > window.innerHeight + 2) {
                problems.push(`critical card ${index} clipped vertically`);
              }

              if (rect.top < headerTotal - 2 && rect.bottom > headerTotal) {
                problems.push(`critical card ${index} intersects header/ticker`);
              }
            }

            return problems;
          });

          failures.push(
            ...(pageFailures as string[]).map(
              (failure: string) => `${route.label} ${viewport.label} ${zoom}x ${failure}`,
            ),
          );
        }

        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length > 0) {
    failures.forEach((failure) => console.error(`✗ ${failure}`));
    process.exit(1);
  }

  console.log(
    `✓ Responsive smoke passed for ${ROUTES.length} routes across ${VIEWPORTS.length} viewports and ${ZOOM_LEVELS.length} zoom levels.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
