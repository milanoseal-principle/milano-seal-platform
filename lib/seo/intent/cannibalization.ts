import type { SeoAuthorityNode } from "../authority/types";
export const normalizePrimaryQuery = (query: string) => query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\b(the|a|an)\b/g, " ").replace(/\s+/g, " ").trim();
export function findIntentCollisions(nodes: SeoAuthorityNode[]) {
  const seen = new Map<string, SeoAuthorityNode>();
  const collisions: Array<[SeoAuthorityNode, SeoAuthorityNode]> = [];
  for (const node of nodes.filter((item) => item.status === "INDEXABLE")) {
    const key = `${node.intent}:${normalizePrimaryQuery(node.primaryQuery)}`;
    const existing = seen.get(key);
    if (existing) collisions.push([existing, node]); else seen.set(key, node);
  }
  return collisions;
}
