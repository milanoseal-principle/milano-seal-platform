/**
 * contentRegistry — maps existing content to pillars. Country topics are derived
 * from Atlas (canonical DESTINATIONS) rather than a duplicate country registry.
 * Every mapped topic declares its pillar and internal-link targets.
 */

import { DESTINATIONS } from "@/data/destinations";
import { AUTHORITY_PILLARS } from "@/lib/topical-authority/topicRegistry";
import type { TopicRecord } from "@/lib/topical-authority/types";

/** Pillar hub topics (one per pillar) — the canonical entry pages. */
export const PILLAR_TOPICS: TopicRecord[] = AUTHORITY_PILLARS.map((p) => ({
  id: `topic-${p.id}`,
  slug: p.id,
  name: p.name,
  pillarId: p.id,
  contentType: "pillar",
  searchIntent: "commercial_investigation",
  primaryRoute: p.primaryRoute,
  internalLinkTargets: ["/intake", "/map"],
  canonicalSource: p.reuses ?? "milano-seal",
  status: "published",
}));

/** Country topics derived from Atlas — NOT a second country registry. */
export function countryTopics(): TopicRecord[] {
  return DESTINATIONS.map((d) => ({
    id: `topic-country-${d.slug}`,
    slug: d.slug,
    name: `${d.name} Document Intelligence`,
    pillarId: "pillar-country-intelligence",
    contentType: "destination",
    searchIntent: "destination_specific",
    primaryRoute: `/countries/${d.slug}`,
    internalLinkTargets: ["/map", "/services/apostille-coordination", "/intake"],
    canonicalSource: "atlas",
    status: "published",
  }));
}

/** Full topic set = pillars + Atlas-derived country topics. */
export function allTopics(): TopicRecord[] {
  return [...PILLAR_TOPICS, ...countryTopics()];
}

/** Every topic must belong to a known pillar and carry internal links. */
export function findUnmappedTopics(): TopicRecord[] {
  const pillarIds = new Set(AUTHORITY_PILLARS.map((p) => p.id));
  return allTopics().filter((t) => !pillarIds.has(t.pillarId) || t.internalLinkTargets.length === 0);
}
