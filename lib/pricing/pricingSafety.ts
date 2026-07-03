// Public-surface pricing safety guards. Ensures no exact internal price, cheap
// framing, or checkout language leaks onto public/client-facing surfaces.

// Terms that must never appear on a public pricing surface.
export const BANNED_PUBLIC_PRICING_TERMS = [
  "buy now",
  "checkout",
  "order now",
  "add to cart",
  "stripe",
  "price match",
  "low cost",
  "cheap",
  "discount",
  "coupon",
  "100% off",
];

// Exact internal anchors that must never be printed publicly.
export const BANNED_PUBLIC_PRICE_ANCHORS = ["$25", "$50", "$75", "$99", "$750", "$975", "$1,850", "$1850"];

export function containsBannedPublicPricing(text: string): string[] {
  const lower = text.toLowerCase();
  const hits: string[] = [];
  for (const term of BANNED_PUBLIC_PRICING_TERMS) {
    if (lower.includes(term)) hits.push(term);
  }
  for (const anchor of BANNED_PUBLIC_PRICE_ANCHORS) {
    if (text.includes(anchor)) hits.push(anchor);
  }
  return hits;
}

// Guard: strip any exact dollar figure from a string intended for public display.
export function assertNoExactPrice(text: string): boolean {
  return !/\$\s?\d/.test(text);
}
