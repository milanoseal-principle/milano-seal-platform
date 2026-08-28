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
  assert.match(directory, /Hague \/ apostille-route review/);
  assert.match(directory, /Non-Hague \/ authentication review/);
  assert.match(directory, /Apostille review/);
  assert.doesNotMatch(directory, /Hague Convention member — apostille accepted/);
  assert.doesNotMatch(directory, /Non-member — consular legalization required/);
});

test("country directory cards are differentiated jurisdiction dossiers, not cloned generic cards", () => {
  assert.match(directory, /CountryDirectoryDossier/);
  assert.match(directory, /Jurisdiction dossier/);
  assert.match(directory, /Controlling route/);
  assert.match(directory, /Common matters/);
  assert.match(directory, /Route checkpoints/);
  assert.match(directory, /Compliance gate/);
  assert.match(directory, /country\.executionPath/);
  assert.match(directory, /country\.note/);
  assert.match(directory, /country\.commonDocuments/);
  assert.match(directory, /buildDestinationIntelligence/);
  assert.match(directory, /getPublicCountryExecutionIntelligence/);
});

test("filtered country dossiers preserve fail-closed routing without duplicate treaty registries", () => {
  assert.match(countriesPage, /apostille, authentication, consular, receiving-authority/);
  assert.doesNotMatch(directory, /const\s+NON_HAGUE_COUNTRIES\s*=/);
  assert.doesNotMatch(directory, /const\s+HAGUE_COUNTRIES\s*=/);
  assert.doesNotMatch(directory, /hague:\s*(true|false)/);
});
