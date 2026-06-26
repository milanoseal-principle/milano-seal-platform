/**
 * THE MILANO SEAL™ — Canonical Brand Identity Layer
 * ---------------------------------------------------
 * LOCKED brand system. Source of truth: Milano Seal Final Brand Board +
 * Milano Seal Final Master Report.
 *
 * Do not alter these values without a brand-level decision. UI components
 * should import from here rather than hard-coding brand colors, type, or copy.
 */

export const MILANO_BRAND = {
  name: "The Milano Seal™",
  tagline: "SEALING TRUST IN EVERY SIGNATURE",
  positioning: "International Document Execution & Apostille Coordination",
  brandPromise: "Sealing Trust in Every Signature",
} as const;

/** Core visual system — the only canonical brand colors. */
export const MILANO_COLORS = {
  matteBlack: "#0A0A0A", // Archive Black
  milanoGold: "#C6A65B", // Antique Gold — canonical
  ivoryParchment: "#F6F1E6", // Embassy Parchment
  signatureWhite: "#FFFFFF", // Clean White
} as const;

/**
 * Legacy gold alias. Existing production UI widely uses #C6A55A — a near-
 * identical antique gold. New work should prefer MILANO_COLORS.milanoGold.
 */
export const MILANO_GOLD_LEGACY = "#C6A55A" as const;

export const MILANO_TYPOGRAPHY = {
  primary: "Trajan Pro", // Display / logo lockups
  secondary: "Cinzel", // Subheads / refined caps
  body: "Playfair Display", // Body copy
} as const;

/** Brand personality — how the brand carries itself. */
export const MILANO_PERSONALITY = [
  "Authoritative",
  "Precise",
  "Discreet",
  "Elevated",
  "Reliable",
] as const;

/** Tone of voice. */
export const MILANO_TONE = {
  attributes: ["Calm", "Confident", "Professional", "Refined"],
  style: ["Direct", "Clear", "Solution-focused"],
  do: "Use legal clarity and premium language.",
  dont: "Use casual language or industry slang.",
} as const;

/**
 * Internal-only core values. "Results First" is an INTERNAL value and must
 * NOT be presented to the public as a guarantee.
 */
export const MILANO_INTERNAL_VALUES = [
  "Trust Above All",
  "Precision in Every Step",
  "Confidentiality Always",
  "Global Authority",
  "Luxury Experience",
  "Results First", // INTERNAL ONLY — never a public guarantee
] as const;

/**
 * Public-facing values. Excludes "Results First" — never make it a public
 * promise per brand rule.
 */
export const MILANO_PUBLIC_VALUES = [
  "Trust Above All",
  "Precision in Every Step",
  "Confidentiality Always",
  "Global Authority",
  "Luxury Experience",
] as const;

/** What we are NOT — guardrails for public positioning. */
export const MILANO_NOT = [
  "NOT a discount notary",
  "NOT a document shipping service",
  "NOT a DIY legal platform",
  "NOT a marketplace",
] as const;

export const MILANO_BRAND_RULE =
  "Luxury legal-execution authority — not a discount notary, not a marketplace, not a DIY legal platform.";

export type MilanoColorKey = keyof typeof MILANO_COLORS;
