import { findBlockedPublicClaims, getReceivingAuthorityWarning } from "./claimSafety";
import { getSafePublicCtaFallback, isAllowedPublicCta } from "./ctaPolicy";
import { assertNoPublicPriceBreakdown } from "./pricingVisibilityPolicy";

export function validatePublicCopy(copy: string) { return { blockedClaims: findBlockedPublicClaims(copy), pricingSafe: assertNoPublicPriceBreakdown(copy), warning: getReceivingAuthorityWarning() }; }
export function sanitizePublicCta(value: string) { return isAllowedPublicCta(value) ? value : getSafePublicCtaFallback(); }
export function isPublicCopySafe(copy: string) { const result = validatePublicCopy(copy); return result.blockedClaims.length === 0 && result.pricingSafe; }
