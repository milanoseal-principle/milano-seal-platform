import { localeFromAcceptLanguage, normalizeLocale, type SupportedLocale } from "./config";
export interface LocaleResolutionInput { explicitChoice?: string | null; preferredLanguage?: string | null; cookieLocale?: string | null; pathLocale?: string | null; acceptLanguage?: string | null; countryRecommendation?: string | null; }
export function resolveLocale(input: LocaleResolutionInput): SupportedLocale {
  return normalizeLocale(input.explicitChoice) ?? normalizeLocale(input.preferredLanguage) ?? normalizeLocale(input.cookieLocale) ?? normalizeLocale(input.pathLocale) ?? localeFromAcceptLanguage(input.acceptLanguage) ?? normalizeLocale(input.countryRecommendation) ?? "en";
}
export function localeFromPathname(pathname: string): SupportedLocale | undefined { return normalizeLocale(pathname.split("/").filter(Boolean)[0]); }
