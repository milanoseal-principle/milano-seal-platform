export const MILANO_BRAND_ASSETS = {
  /** Cinematic ritual orb — login ritual, post-auth unlock, dashboard hero, Today Mode, major confirmation */
  ritualOrb: "/brand/milano-seal-orb-v2.png",
  /** Global intelligence / brain / system logic — map, countries, truth, monitoring, route intelligence */
  coreBrainFeather: "/brand/milano-seal-core-brain-feather.png",
  /** Compact brand identity — nav, sidebar, portal headers, VA, alliance, chat launcher, cards, footer */
  featherMOrb: "/brand/milano-seal-feather-m-orb.png",
} as const;

export type MilanoBrandAssetKey = keyof typeof MILANO_BRAND_ASSETS;
