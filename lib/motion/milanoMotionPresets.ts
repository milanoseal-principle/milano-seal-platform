export const MILANO_EASE = [0.16, 1, 0.3, 1] as const;

export const MILANO_MOTION = {
  fast: 0.2,
  standard: 0.35,
  deliberate: 0.55,
  revealY: 14,
  stagger: 0.055,
  statusPulse: 1.8,
} as const;

export const MILANO_STATE_TONES = {
  neutral: {
    border: "rgba(255,255,255,0.08)",
    glow: "rgba(255,255,255,0.04)",
  },
  active: {
    border: "rgba(198,166,91,0.34)",
    glow: "rgba(198,166,91,0.16)",
  },
  verified: {
    border: "rgba(52,211,153,0.30)",
    glow: "rgba(52,211,153,0.12)",
  },
  review: {
    border: "rgba(251,191,36,0.30)",
    glow: "rgba(251,191,36,0.10)",
  },
  exception: {
    border: "rgba(248,113,113,0.30)",
    glow: "rgba(248,113,113,0.10)",
  },
} as const;

export type MilanoStateTone = keyof typeof MILANO_STATE_TONES;
