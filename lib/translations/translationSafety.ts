export const BANNED_TRANSLATION_CLAIMS: string[] = [
  "guaranteed acceptance",
  "guaranteed approval",
  "government approved",
  "Hague compliant",
  "official government partner",
  "cheap notary",
  "Buy Now",
  "Checkout",
  "Order Now",
  "Stripe",
];

export function containsBannedTranslationClaim(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_TRANSLATION_CLAIMS.filter((claim) =>
    lower.includes(claim.toLowerCase())
  );
}
