import { getRelatedSeoNodes } from "./graph";
import type { SeoAuthorityNode } from "./types";
export function getAuthorityLinks(node: SeoAuthorityNode) {
  return Array.from(new Set([node.canonicalParent, `/documents/${node.documentSlug === "affidavits" ? "affidavit" : node.documentSlug}-apostille`, `/professional/${node.countrySlug}`, "/global-document-intelligence", ...getRelatedSeoNodes(node).map((item) => item.path), node.conversionTarget].filter((path): path is string => Boolean(path)))).slice(0, 8);
}
