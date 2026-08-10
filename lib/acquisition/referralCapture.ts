export type AcquisitionSource =
  | "google"
  | "bing"
  | "yahoo"
  | "duckduckgo"
  | "brave"
  | "chatgpt"
  | "perplexity"
  | "attorney-referral"
  | "client-referral"
  | "instagram"
  | "linkedin"
  | "other"
  | "unknown";

export interface ReferralCapture {
  source: AcquisitionSource;
  channel: string;
  matterId?: string;
  capturedAt: string;
  landingSource?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const SOURCE_ALIASES: Array<[AcquisitionSource, RegExp]> = [
  ["google", /(^|[.\s/_-])google([.\s/_-]|$)|google\.com/i],
  ["bing", /(^|[.\s/_-])bing([.\s/_-]|$)|bing\.com/i],
  ["yahoo", /(^|[.\s/_-])yahoo([.\s/_-]|$)|search\.yahoo\.com/i],
  ["duckduckgo", /duckduckgo|duck\.com/i],
  ["brave", /search\.brave\.com|(^|[.\s/_-])brave([.\s/_-]|$)/i],
  ["chatgpt", /chatgpt|chat\.openai\.com|openai\.com/i],
  ["perplexity", /perplexity/i],
  ["attorney-referral", /attorney|lawyer|law[-_\s]?firm|counsel/i],
  ["client-referral", /client[-_\s]?referral|friend|family|word[-_\s]?of[-_\s]?mouth/i],
  ["instagram", /instagram|instagr\.am/i],
  ["linkedin", /linkedin/i],
];

function clean(value?: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeReferralSource(source: string): string {
  return source.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function detectAcquisitionSource(input: {
  referralSource?: unknown;
  utmSource?: unknown;
  referrer?: unknown;
  landingSource?: unknown;
}): AcquisitionSource {
  const candidates = [
    clean(input.referralSource),
    clean(input.utmSource),
    clean(input.referrer),
    clean(input.landingSource),
  ].filter(Boolean);

  for (const candidate of candidates) {
    for (const [source, pattern] of SOURCE_ALIASES) {
      if (pattern.test(candidate)) return source;
    }
  }

  if (candidates.length > 0) return "other";
  return "unknown";
}

export function buildReferralCapture(input: {
  channel: string;
  matterId?: string;
  referralSource?: unknown;
  landingSource?: unknown;
  referrer?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  capturedAt?: string;
}): ReferralCapture {
  return {
    source: detectAcquisitionSource({
      referralSource: input.referralSource,
      utmSource: input.utmSource,
      referrer: input.referrer,
      landingSource: input.landingSource,
    }),
    channel: input.channel,
    matterId: input.matterId,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    landingSource: clean(input.landingSource) || undefined,
    referrer: clean(input.referrer) || undefined,
    utmSource: clean(input.utmSource) || undefined,
    utmMedium: clean(input.utmMedium) || undefined,
    utmCampaign: clean(input.utmCampaign) || undefined,
  };
}
