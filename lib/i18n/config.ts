export const SUPPORTED_LOCALES = ["en", "it", "es", "de", "fr", "pt-BR"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_LABELS: Record<SupportedLocale, string> = { en: "English", it: "Italiano", es: "Español", de: "Deutsch", fr: "Français", "pt-BR": "Português" };
export const LOCALE_PREFIXES: Record<SupportedLocale, string> = { en: "en", it: "it", es: "es", de: "de", fr: "fr", "pt-BR": "pt-br" };
export function normalizeLocale(value?: string | null): SupportedLocale | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase().replace("_", "-");
  if (normalized === "pt" || normalized === "pt-br" || normalized === "pt-brasil") return "pt-BR";
  return SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === normalized || locale.split("-")[0].toLowerCase() === normalized);
}
export function localeTag(locale: SupportedLocale): string { return locale === "pt-BR" ? "pt-BR" : locale; }
export function localePrefix(locale: SupportedLocale): string { return LOCALE_PREFIXES[locale]; }
export function localeFromAcceptLanguage(header?: string | null): SupportedLocale | undefined {
  if (!header) return undefined;
  for (const entry of header.split(",")) { const locale = normalizeLocale(entry.split(";")[0]); if (locale) return locale; }
  return undefined;
}
