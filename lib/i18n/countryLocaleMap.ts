import type { SupportedLocale } from "./config";
export interface CountryLocaleConfig { countryCode: string; countrySlug: string; defaultLocale: SupportedLocale; supportedLocales: SupportedLocale[]; promptBeforeSwitch: boolean; }
export const COUNTRY_LOCALE_MAP: Record<string, CountryLocaleConfig> = {
  IT: { countryCode: "IT", countrySlug: "italy", defaultLocale: "it", supportedLocales: ["it", "en"], promptBeforeSwitch: false },
  ES: { countryCode: "ES", countrySlug: "spain", defaultLocale: "es", supportedLocales: ["es", "en"], promptBeforeSwitch: false },
  DE: { countryCode: "DE", countrySlug: "germany", defaultLocale: "de", supportedLocales: ["de", "en"], promptBeforeSwitch: false },
  FR: { countryCode: "FR", countrySlug: "france", defaultLocale: "fr", supportedLocales: ["fr", "en"], promptBeforeSwitch: false },
  BR: { countryCode: "BR", countrySlug: "brazil", defaultLocale: "pt-BR", supportedLocales: ["pt-BR", "en"], promptBeforeSwitch: false },
  CH: { countryCode: "CH", countrySlug: "switzerland", defaultLocale: "de", supportedLocales: ["de", "fr", "it", "en"], promptBeforeSwitch: true },
  BE: { countryCode: "BE", countrySlug: "belgium", defaultLocale: "fr", supportedLocales: ["fr", "de", "en"], promptBeforeSwitch: true },
  CA: { countryCode: "CA", countrySlug: "canada", defaultLocale: "en", supportedLocales: ["en", "fr"], promptBeforeSwitch: true },
};
export function getCountryLocaleConfig(countryCode?: string | null): CountryLocaleConfig | undefined { return countryCode ? COUNTRY_LOCALE_MAP[countryCode.toUpperCase()] : undefined; }
