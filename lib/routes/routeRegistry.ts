export const PUBLIC_LIVE_ROUTES = [
  "/",
  "/pricing",
  "/secure-portal",
  "/intake",
  "/intake/confirmation",
  "/map",
  "/apostille/italy",
  "/apostille/brazil",
] as const;

export const INTERNAL_DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/command-center",
  "/dashboard/discounts",
  "/dashboard/referrals",
  "/dashboard/seo-authority",
  "/dashboard/compliance-atlas",
  "/dashboard/operator-terminal",
  "/dashboard/invoices",
  "/dashboard/intelligence/sales-lab",
] as const;

export const STAGED_AUTHORITY_ROUTES = [
  "/international-affidavit",
  "/power-of-attorney-international",
  "/affidavit-name-discrepancy",
  "/affidavit-one-and-the-same",
  "/affidavit-non-existence-record",
  "/affidavit-translation-accuracy",
  "/fbi-apostille",
  "/international-notary",
  "/remote-online-notary",
] as const;

export const FUTURE_PROGRAMMATIC_ENGINE = {
  status: "staged_only",
  targetPageCount: 2400,
  requires: [
    "verified content model",
    "canonical URL rules",
    "duplicate content guard",
    "sitemap batching",
    "noindex protection for drafts",
    "country data verification",
    "operator approval",
  ],
} as const;

export type RouteStatus = "public_live" | "internal_noindex" | "staged_noindex" | "unknown";
export type PublicLiveRoute = (typeof PUBLIC_LIVE_ROUTES)[number];
export type InternalDashboardRoute = (typeof INTERNAL_DASHBOARD_ROUTES)[number];
export type StagedAuthorityRoute = (typeof STAGED_AUTHORITY_ROUTES)[number];

export function isPublicLiveRoute(route: string): route is PublicLiveRoute {
  return PUBLIC_LIVE_ROUTES.includes(route as PublicLiveRoute);
}

export function isInternalDashboardRoute(route: string): route is InternalDashboardRoute {
  return INTERNAL_DASHBOARD_ROUTES.includes(route as InternalDashboardRoute);
}

export function isStagedAuthorityRoute(route: string): route is StagedAuthorityRoute {
  return STAGED_AUTHORITY_ROUTES.includes(route as StagedAuthorityRoute);
}

export function isProgrammaticAllowed(): boolean {
  return false;
}

export function getSitemapRoutes(): PublicLiveRoute[] {
  return [...PUBLIC_LIVE_ROUTES];
}

export function getNoIndexRoutes(): string[] {
  return [...INTERNAL_DASHBOARD_ROUTES, ...STAGED_AUTHORITY_ROUTES];
}

export function getRouteStatus(route: string): RouteStatus {
  if (isPublicLiveRoute(route)) return "public_live";
  if (isInternalDashboardRoute(route)) return "internal_noindex";
  if (isStagedAuthorityRoute(route)) return "staged_noindex";
  return "unknown";
}
