export function isPublicExactPricingAllowed() { return false; }
export function getPublicPricingDisplay() { return "Quote issued after review"; }
export function assertNoPublicPriceBreakdown(copy: string) { return !/\$\s?\d|Stripe|coupon|payment bypass/i.test(copy); }
