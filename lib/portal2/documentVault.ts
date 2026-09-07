// Client Portal 2.0 — client-safe document vault view.

import type { DocumentVaultItem, PortalMatter } from "./types";

/**
 * Categories that are always safe to show a client.
 * Internal work product is never modeled as a DocumentVaultItem, but we filter
 * defensively regardless.
 */
const CLIENT_VISIBLE_CATEGORIES: ReadonlySet<DocumentVaultItem["category"]> = new Set([
  "client_upload",
  "executed_document",
  "apostille",
  "release_packet",
  "certificate",
]);

/** Return only the vault items a client is allowed to see. Pure/read-only. */
export function buildClientVault(matter: PortalMatter): DocumentVaultItem[] {
  return (matter.vault ?? []).filter((item) => CLIENT_VISIBLE_CATEGORIES.has(item.category));
}

/** Items the client can download right now. */
export function downloadableVaultItems(matter: PortalMatter): DocumentVaultItem[] {
  return buildClientVault(matter).filter((item) => item.downloadable && item.status === "available");
}
