export const BANNED_APOSTILLE_CLAIMS: string[] = [
  "FBI approved",
  "FDLE approved",
  "official government partner",
  "government approved",
  "guaranteed acceptance",
  "guaranteed clearance",
  "guaranteed approval",
  "Hague compliant",
  "government approved apostille",
  "cheap notary",
  "Buy Now",
  "Checkout",
  "Order Now",
  "Stripe",
];

export function containsBannedApostilleClaim(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_APOSTILLE_CLAIMS.filter((claim) =>
    lower.includes(claim.toLowerCase())
  );
}
