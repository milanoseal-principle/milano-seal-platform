import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "lib/i18n/public-dictionary.ts",
  "components/i18n/PublicI18nProvider.tsx",
  "components/i18n/GlobalLanguageSelector.tsx",
  "components/i18n/PublicRouteLocaleBridge.tsx",
  "lib/i18n/public-route-copy.ts",
  "components/landing/header.tsx",
  "components/landing/credential-ticker.tsx",
  "components/landing/hero.tsx",
  "components/landing/services.tsx",
  "components/landing/how-it-works.tsx",
  "components/landing/payment-founder.tsx",
  "components/landing/footer.tsx",
  "components/conversion/FinalCTA.tsx",
  "components/NavigationLoader.tsx",
  "components/system/MilanoProductState.tsx",
];

for (const file of required) assert.ok(existsSync(file), `Missing public i18n dependency: ${file}`);

const dictionary = readFileSync("lib/i18n/public-dictionary.ts", "utf8");
for (const token of ['en: EN','it: IT','es: ES','de: DE','fr: FR','"pt-BR": PT']) {
  assert.ok(dictionary.includes(token), `Canonical public dictionary missing locale binding: ${token}`);
}
assert.ok(!dictionary.includes("ticker:EN.ticker"), "Exposed locale must not fall back to English ticker copy");
for (const localeConst of ["IT", "PT", "ES", "DE", "FR"]) {
  const match = dictionary.match(new RegExp(`const ${localeConst}: PublicTranslation = \\{([\\s\\S]*?)(?=\\nconst |\\nexport const PUBLIC_TRANSLATIONS)`));
  assert.ok(match, `Missing explicit dictionary block for ${localeConst}`);
  const block = match?.[1] ?? "";
  assert.ok(block.includes("cards:["), `${localeConst} must define localized service cards`);
  assert.ok(block.includes("steps:["), `${localeConst} must define localized process steps`);
  assert.ok(block.includes("ticker:{railA:["), `${localeConst} must define localized ticker copy`);
  assert.ok(block.includes("credentials:["), `${localeConst} must define localized founder credentials`);
  assert.ok(block.includes("network:["), `${localeConst} must define localized footer navigation`);
}
for (const governed of [
  "autorità ricevente",
  "autoridade receptora",
  "autorità competente",
  "autoridade competente",
  "non è uno studio legale",
  "não é um escritório de advocacia",
]) {
  assert.ok(dictionary.toLowerCase().includes(governed.toLowerCase()), `Governed Italian/Portuguese compliance copy missing: ${governed}`);
}

const selector = readFileSync("components/i18n/GlobalLanguageSelector.tsx", "utf8");
assert.ok(selector.includes("usePublicTranslations"), "Selector must update canonical public locale state");
assert.ok(selector.includes("document.documentElement.lang"), "Selector must update document language immediately");
assert.ok(!selector.includes("window.location.reload()"), "Selector must not reload merely to translate shared public UI");

const layout = readFileSync("app/layout.tsx", "utf8");
assert.ok(layout.includes("PublicI18nProvider initialLocale={locale}"), "Root layout must server-seed public locale from cookie");
assert.ok(layout.includes("<PublicRouteLocaleBridge />"), "Root layout must activate route-level locale continuity");

const routeBridge = readFileSync("components/i18n/PublicRouteLocaleBridge.tsx", "utf8");
const routeCopy = readFileSync("lib/i18n/public-route-copy.ts", "utf8");
for (const route of ["/services","/pricing","/process","/global-document-intelligence","/professional","/secure-portal","/login","/intake"]) {
  assert.ok(routeBridge.includes(`"${route}"`), `Public route locale bridge missing header destination: ${route}`);
}
for (const locale of ['it','es','de','fr','"pt-BR"']) {
  assert.ok(routeCopy.includes(`${locale}:`), `Route-copy dictionary missing locale coverage: ${locale}`);
}
for (const marker of ["Built for international document control, not commodity notarization.","Execution Quote","How It Works","Execution Intelligence Workspace","Professional Execution Access","Secure Access","Begin Your Execution"]) {
  assert.ok(routeCopy.includes(marker), `Route-copy dictionary missing primary destination marker: ${marker}`);
}
assert.ok(routeBridge.includes("MutationObserver"), "Route locale bridge must translate dynamically-rendered public UI");
assert.ok(routeBridge.includes('["placeholder","aria-label","title"]'), "Route locale bridge must translate public form attributes");

for (const file of required.filter((file) =>
  file.startsWith("components/") &&
  !file.includes("GlobalLanguageSelector") &&
  !file.includes("PublicI18nProvider")
)) {
  const source = readFileSync(file, "utf8");
  if (file.endsWith("MilanoProductState.tsx") || file.endsWith("NavigationLoader.tsx") || file.includes("/landing/") || file.includes("/conversion/")) {
    assert.ok(source.includes("usePublicTranslations"), `Shared public surface is not wired to canonical translations: ${file}`);
  }
}

console.log("PASS canonical public i18n runtime: six locales, shared shell, header destinations, dynamic route continuity, forms, and governed compliance copy");
