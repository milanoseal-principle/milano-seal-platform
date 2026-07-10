// Resolves a country/vertical-specific call-to-action. All CTAs route to either
// /intake or /secure-portal. Copy is descriptive only — it never promises an
// outcome, acceptance, approval, or legal/immigration advice.

import type { DynamicCtaContext, ResolvedCta } from "./types";

const INTAKE = "/intake";
const PORTAL = "/secure-portal";

function withCountry(base: string, country?: string | null): string {
  const c = country?.trim();
  return c ? `${base} for use in ${c}` : base;
}

/**
 * Deterministic CTA resolution by vertical (and optionally country/urgency).
 */
export function resolveCta(ctx: DynamicCtaContext): ResolvedCta {
  const emergency = ctx.urgency === "emergency";

  switch (ctx.vertical) {
    case "attorney":
      return {
        label: emergency ? "Open Priority Attorney Intake" : "Begin Attorney Intake",
        href: INTAKE,
        note: withCountry(
          "Coordinate execution for client matters with a reviewed document path",
          ctx.country,
        ),
      };

    case "university":
      return {
        label: "Begin Institutional Intake",
        href: INTAKE,
        note: withCountry(
          "Coordinate execution of academic and enrollment documents",
          ctx.country,
        ),
      };

    case "healthcare":
      return {
        label: "Begin Healthcare Document Intake",
        href: INTAKE,
        note: withCountry(
          "Coordinate execution of credentialing and licensing documents",
          ctx.country,
        ),
      };

    case "immigration_professional":
      return {
        label: "Begin Professional Intake",
        href: INTAKE,
        note: withCountry(
          "Coordinate document execution for your clients' international filings",
          ctx.country,
        ),
      };

    case "airport_emergency":
      return {
        label: "Open Emergency Coordination",
        href: PORTAL,
        note: withCountry(
          "Time-sensitive document coordination through the secure portal",
          ctx.country,
        ),
      };

    case "general":
    default:
      return {
        label: emergency ? "Open Priority Secure Intake" : "Begin Secure Intake",
        href: INTAKE,
        note: withCountry(
          "Start with a reviewed intake before quote, payment, or scheduling",
          ctx.country,
        ),
      };
  }
}
