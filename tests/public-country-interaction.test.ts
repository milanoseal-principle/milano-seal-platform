import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homepage = readFileSync("app/page.tsx", "utf8");
const countriesPage = readFileSync("app/countries/page.tsx", "utf8");
const globePopover = readFileSync(
  "components/landing/GlobeCountryNodePopover.tsx",
  "utf8",
);
const directory = readFileSync(
  "components/countries/CountriesDirectoryInteractive.tsx",
  "utf8",
);

test("globe country intelligence is anchored to the selected node instead of the opposite viewport quadrant", () => {
  assert.match(homepage, /GlobeCountryNodePopover/);
  assert.match(globePopover, /event\.clientX/);
  assert.match(globePopover, /event\.clientY/);
  assert.match(globePopover, /clampAnchor/);
  assert.match(globePopover, /\[data-target-vector\]/);
  assert.match(globePopover, /data-globe-country-popover/);
  assert.match(globePopover, /\.ms-destination-popover/);
  assert.match(globePopover, /display:\s*none !important/);
});

test("country route classes are interactive filters backed by the canonical destination registry", () => {
  assert.match(countriesPage, /CountriesDirectoryInteractive/);
  assert.match(directory, /DESTINATIONS/);
  assert.match(directory, /setFilter\("hague"\)/);
  assert.match(directory, /setFilter\("non_hague"\)/);
  assert.match(directory, /destination\.hague/);
  assert.match(directory, /!destination\.hague/);
  assert.match(directory, /Hague Convention member — apostille accepted/);
  assert.match(directory, /Non-member — consular legalization required/);
  assert.match(directory, /DestinationIntelligenceCard/);
});

test("filtered country cards preserve compliance and governed routing surfaces", () => {
  assert.match(directory, /variant="countryDirectory"/);
  assert.match(countriesPage, /apostille, authentication, consular, receiving-authority/);
  assert.doesNotMatch(directory, /const\s+NON_HAGUE_COUNTRIES\s*=/);
  assert.doesNotMatch(directory, /const\s+HAGUE_COUNTRIES\s*=/);
});
