export const BANNED_SERVICE_CLAIMS: string[] = [
  "FBI approved",
  "FDLE approved",
  "official government partner",
  "government approved",
  "guaranteed acceptance",
  "guaranteed clearance",
  "guaranteed approval",
  "guarantee acceptance",
  "guarantee approval",
  "Hague compliant",
  "cheap notary",
  "Buy Now",
  "Checkout",
  "Order Now",
  "Stripe",
];

export function containsBannedServiceClaim(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_SERVICE_CLAIMS.filter((claim) =>
    lower.includes(claim.toLowerCase())
  );
}
