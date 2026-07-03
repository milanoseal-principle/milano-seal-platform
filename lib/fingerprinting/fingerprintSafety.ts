export const BANNED_FINGERPRINT_CLAIMS: string[] = [
  "FBI approved",
  "FDLE approved",
  "official government partner",
  "government approved",
  "guaranteed acceptance",
  "guaranteed clearance",
  "guaranteed approval",
  "firearms advice",
  "immigration advice",
  "Hague compliant",
  "cheap notary",
  "Buy Now",
  "Checkout",
  "Order Now",
  "Stripe",
];

export function containsBannedFingerprintClaim(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_FINGERPRINT_CLAIMS.filter((claim) =>
    lower.includes(claim.toLowerCase())
  );
}
