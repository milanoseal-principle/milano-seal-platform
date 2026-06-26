export const MILANO_BRAND_ASSETS = {
  milanoSealOrbV2: "/brand/milano-seal-orb-v2.png",
  milanoSealCoreBrainFeather: "/brand/milano-seal-core-brain-feather.png",
  milanoSealFeatherMOrb: "/brand/milano-seal-feather-m-orb.png",
} as const;

export type MilanoBrandAssetKey = keyof typeof MILANO_BRAND_ASSETS;
