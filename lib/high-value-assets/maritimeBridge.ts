/**
 * maritimeBridge — bridges vessel/marine high-value asset matters into the
 * existing Maritime vertical. Reuses maritime types/trust-events; never
 * duplicates the Maritime command center or pricing.
 */

import type { HighValueAssetMatter } from "@/lib/high-value-assets/types";
import type { MaritimeMatterOverlay } from "@/lib/maritime/types";
import type { MaritimeTrustEventType } from "@/lib/trust-chain/maritimeTrustEvents";

/** True when the asset matter should route through the Maritime workflow. */
export function shouldUseMaritimeWorkflow(m: HighValueAssetMatter): boolean {
  return (
    m.maritimeLinked ||
    m.assetCategory === "vessel" ||
    m.documentFamilies.includes("preferred-ship-mortgage") ||
    m.safetyFlags.requiresUSCGReview
  );
}

/** Map an asset matter into a canonical Maritime overlay (references only). */
export function mapAssetMatterToMaritimeContext(m: HighValueAssetMatter): MaritimeMatterOverlay {
  return {
    matterId: m.matterId ?? m.id,
    documentFamily: m.documentFamilies[0] ?? null,
    apostilleRequired: m.documentFamilies.includes("apostille-package") ? true : "unknown",
    finalDestinationCountryId: null,
    nextOperatorAction: m.operatorNextAction,
  };
}

/** Merge asset context with maritime trust-chain events (dedup, order-preserving). */
export function mergeMaritimeTrustChainEvents(
  _m: HighValueAssetMatter,
  maritimeEvents: MaritimeTrustEventType[],
): MaritimeTrustEventType[] {
  const seen = new Set<MaritimeTrustEventType>();
  const out: MaritimeTrustEventType[] = [];
  for (const e of maritimeEvents) {
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out;
}
