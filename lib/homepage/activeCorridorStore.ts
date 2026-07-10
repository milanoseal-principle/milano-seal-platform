/**
 * activeCorridorStore — a tiny shared store so the homepage Mini Atlas and the
 * Milano Trust Core intelligence engine stay in sync without prop-drilling across
 * unrelated sections of the page.
 *
 * The Mini Atlas publishes its currently-featured canonical destination slug; the
 * Trust Core subscribes and runs its illustrative verification sequence for that
 * same corridor. This is presentation-only, public, canonical-data state — it
 * carries NO matter data, NO client data, and never touches protected systems.
 */

import { DESTINATIONS } from "@/data/destinations";

const DEFAULT_SLUG =
  DESTINATIONS.find((d) => d.slug === "italy")?.slug ??
  DESTINATIONS[0]?.slug ??
  "italy";

let activeSlug: string = DEFAULT_SLUG;
const listeners = new Set<() => void>();

export function setActiveCorridor(slug: string): void {
  if (!slug || slug === activeSlug) return;
  activeSlug = slug;
  listeners.forEach((cb) => cb());
}

export function subscribeActiveCorridor(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getActiveCorridorSnapshot(): string {
  return activeSlug;
}

/** Stable server snapshot for SSR (avoids hydration mismatch). */
export function getActiveCorridorServerSnapshot(): string {
  return DEFAULT_SLUG;
}
