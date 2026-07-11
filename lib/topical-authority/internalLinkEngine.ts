/**
 * internalLinkEngine — link rules + orphan detection over the topic graph.
 * No page may be orphaned; every topic links toward intake and its pillar.
 */

import type { TopicRecord } from "@/lib/topical-authority/types";
import { allTopics } from "@/lib/topical-authority/contentRegistry";

export interface OrphanReport {
  orphans: TopicRecord[];
  missingIntakeLink: TopicRecord[];
}

/** A topic is an orphan if no other topic links to its primary route. */
export function detectOrphans(topics: TopicRecord[] = allTopics()): OrphanReport {
  const inboundRoutes = new Set<string>();
  for (const t of topics) for (const target of t.internalLinkTargets) inboundRoutes.add(target);

  const pillarRoutes = new Set(topics.filter((t) => t.contentType === "pillar").map((t) => t.primaryRoute));

  const orphans = topics.filter(
    (t) => t.contentType !== "pillar" && !inboundRoutes.has(t.primaryRoute) && !pillarRoutes.has(t.primaryRoute),
  );
  const missingIntakeLink = topics.filter((t) => !t.internalLinkTargets.some((l) => l.startsWith("/intake")));

  return { orphans, missingIntakeLink };
}

/** True when the whole topic graph satisfies the intake-link rule. */
export function everyTopicLinksToIntake(topics: TopicRecord[] = allTopics()): boolean {
  return topics.every((t) => t.internalLinkTargets.some((l) => l.startsWith("/intake")));
}
