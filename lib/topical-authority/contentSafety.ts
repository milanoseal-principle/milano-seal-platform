/**
 * contentSafety — guards against doorway pages, duplicate search intent, fake
 * SEO metrics, and unsupported public claims. People-first content only.
 */

import type { TopicRecord } from "@/lib/topical-authority/types";

export const CONTENT_BANNED_CLAIMS = [
  "official authority",
  "government approved",
  "guaranteed acceptance",
  "largest apostille",
  "#1 apostille",
  "best notary in the world",
  "legal advice",
  "immigration advice",
  "medical advice",
] as const;

export function containsBannedContentClaim(text: string | null | undefined): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return CONTENT_BANNED_CLAIMS.some((c) => t.includes(c));
}

/** Duplicate primary intent = two topics with the same (pillar + searchIntent + slug root). */
export function findDuplicateIntent(topics: TopicRecord[]): TopicRecord[] {
  const seen = new Map<string, TopicRecord>();
  const dupes: TopicRecord[] = [];
  for (const t of topics) {
    const key = `${t.pillarId}::${t.searchIntent}::${t.slug}`;
    if (seen.has(key)) dupes.push(t);
    else seen.set(key, t);
  }
  return dupes;
}

/**
 * SEO analytics numbers (rankings, impressions, traffic, backlinks) may only be
 * shown when a real integration provides them — never fabricated.
 */
export function isFabricatedMetric(source: string | null | undefined): boolean {
  return !source || source === "placeholder" || source === "sample" || source === "mock";
}
