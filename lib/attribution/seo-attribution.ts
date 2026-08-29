export interface SeoTouch { landingPage: string; referrer?: string; source?: string; medium?: string; campaign?: string; content?: string; term?: string; country?: string; document?: string; language: string; intent?: string; pillar?: string; capturedAt: string }
export interface SeoAttribution { firstTouch: SeoTouch; lastTouch: SeoTouch }
export const SEO_ATTRIBUTION_STORAGE_KEY = "milano_seo_attribution_v1";
const clean = (value: string | null) => value?.slice(0, 500) || undefined;
export function buildSeoTouch(url: URL, referrer = ""): SeoTouch {
  const match = url.pathname.match(/^\/apostille\/([^/]+)\/([^/]+)$/);
  const source = clean(url.searchParams.get("utm_source")) ?? (referrer.includes("google.") ? "google" : referrer.includes("bing.") ? "bing" : undefined);
  return { landingPage: url.pathname, referrer: clean(referrer), source, medium: clean(url.searchParams.get("utm_medium")) ?? (source ? "organic" : undefined), campaign: clean(url.searchParams.get("utm_campaign")), content: clean(url.searchParams.get("utm_content")), term: clean(url.searchParams.get("utm_term")), country: match?.[1], document: match?.[2], language: document.documentElement.lang || navigator.language || "en-US", intent: match ? "transactional" : undefined, capturedAt: new Date().toISOString() };
}
export function mergeSeoAttribution(existing: SeoAttribution | undefined, touch: SeoTouch): SeoAttribution { return { firstTouch: existing?.firstTouch ?? touch, lastTouch: touch }; }
