export const MILANO_BRAND_ASSETS = {
  /** ICON 1 — Identity, navigation, compact headers, client portal, VA, alliance */
  miniOrb: "/brand/milano-mini-orb.png",
  /** ICON 2 — Authority, cinematic entry, login ritual, dashboard hero, founder/operator surfaces */
  crestOrbit: "/brand/milano-crest-orbit.png",
  /** ICON 3 — Verification, release, payment confirmation, delivery, completion states */
  formalSeal: "/brand/milano-formal-seal.png",
} as const;

export type MilanoBrandAsset = keyof typeof MILANO_BRAND_ASSETS;
