// Client Portal 2.0 — client-safe document vault projection.
// Pure/read-only: this module never writes storage, Matter state, payment truth,
// release authority, or document visibility policy outside this projection.

import type { Portal2Matter } from "./types";

export type DocumentVaultCategory =
  | "client_upload"
  | "executed_document"
  | "apostille"
  | "release_packet"
  | "certificate"
  | "internal_work_product";

export interface DocumentVaultItem {
  id: string;
  name: string;
  category: DocumentVaultCategory;
  status: "pending" | "available" | "archived";
  downloadable: boolean;
}

export type Portal2MatterWithVault = Portal2Matter & {
  vault?: readonly DocumentVaultItem[];
};

const CLIENT_VISIBLE_CATEGORIES: ReadonlySet<DocumentVaultCategory> = new Set([
  "client_upload",
  "executed_document",
  "apostille",
  "release_packet",
  "certificate",
]);

/** Return only client-visible vault items. Internal work product fails closed. */
export function buildClientVault(matter: Portal2MatterWithVault): DocumentVaultItem[] {
  return (matter.vault ?? []).filter((item) => CLIENT_VISIBLE_CATEGORIES.has(item.category));
}

/** Return only currently downloadable, available client-visible items. */
export function downloadableVaultItems(
  matter: Portal2MatterWithVault,
): DocumentVaultItem[] {
  return buildClientVault(matter).filter(
    (item) => item.downloadable === true && item.status === "available",
  );
}
