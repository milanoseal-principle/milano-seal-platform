import { COUNSEL_USE_CASES } from "@/lib/counsel/content";
export const PUBLIC_LIVE_ROUTES = [
  "/",
  "/counsel",
  "/counsel/corridors",
  "/counsel/use-cases",
  ...COUNSEL_USE_CASES.map(
    (item) => `/counsel/use-cases/${item.slug}` as const,
  ),
  "/pricing",
  "/secure-portal",
  "/intake",
  "/intake/confirmation",
  "/map",
  "/apostille/italy",
  "/apostille/brazil",
  "/international-affidavits",
  "/international-affidavit",
  "/power-of-attorney-international",
  "/affidavit-name-discrepancy",
  "/affidavit-one-and-the-same",
  "/affidavit-non-existence-record",
  "/affidavit-translation-accuracy",
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
  "/dashboard/shipping",
  "/dashboard/ledger",
  "/dashboard/terminal",
] as const;

export const STAGED_AUTHORITY_ROUTES = [
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

export type RouteStatus =
  | "public_live"
  | "internal_noindex"
  | "staged_noindex"
  | "unknown";
export type PublicLiveRoute = (typeof PUBLIC_LIVE_ROUTES)[number];
export type InternalDashboardRoute = (typeof INTERNAL_DASHBOARD_ROUTES)[number];
export type StagedAuthorityRoute = (typeof STAGED_AUTHORITY_ROUTES)[number];

export function isPublicLiveRoute(route: string): route is PublicLiveRoute {
  return PUBLIC_LIVE_ROUTES.includes(route as PublicLiveRoute);
}

export function isInternalDashboardRoute(
  route: string,
): route is InternalDashboardRoute {
  return INTERNAL_DASHBOARD_ROUTES.includes(route as InternalDashboardRoute);
}

export function isStagedAuthorityRoute(
  route: string,
): route is StagedAuthorityRoute {
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

// ---------------------------------------------------------------------------
// Full route inventory + L0–L6 certification (Master Engineering Directive §02)
//
// The lists above remain the canonical sitemap / noindex lifecycle source. The
// complete per-route inventory is GENERATED from current app/**/page.* and
// app/**/route.* files by the canonical route walker
// (`node scripts/generate-route-map.mjs`, helper scripts/lib/route-inventory.mjs)
// into routeInventory.generated.json, reconciled with these lists,
// moduleRegistry, touchpointRegistry, systemRegistry, commercialInventory and
// the access rules proxy.ts enforces. CI (`--check` and
// `validate:route-registry`) fails on drift, on an unclassified new route, and
// on any loss of a historical-baseline record.
//
// Registration is not certification. L0/L1 are derived; L2–L6 are granted
// only by human-approved entries in routeCertificationEvidence.json bound to
// the route's current source and dependency-graph hashes. Unknown stays
// "UNKNOWN".

export const CERTIFICATION_LEVELS = ["L0", "L1", "L2", "L3", "L4", "L5", "L6"] as const;
export type CertificationLevel = (typeof CERTIFICATION_LEVELS)[number];

export const CERTIFICATION_LEVEL_DEFINITIONS: Record<CertificationLevel, string> = {
  L0: "Discovered: a page/route file exists at HEAD.",
  L1: "Registered: inventory record with an access classification (not UNKNOWN). Not a certification.",
  L2: "Dependencies verified: approved evidence bound to the current source and dependency graph, with tests.",
  L3: "Secured: L2 plus tested anonymous, expired session, permitted role, forbidden role, cross-tenant and mutation cases.",
  L4: "Authenticated workflow verified: L3 plus an end-to-end authenticated workflow test.",
  L5: "Operational/recovery certified: L4 plus deployment-bound and recovery evidence.",
  L6: "Commercially validated: L5 plus commercial evidence.",
};

/**
 * Historical tree named by the Master Engineering Directive §03. Its route-file
 * count is a fixed fact about that commit (not an assertion about HEAD, which
 * is always counted from source). Every baseline record must stay in the
 * inventory, as present or removed_at_head.
 */
export const HISTORICAL_ROUTE_BASELINE = {
  commit: "93ce11c18c8bab4a2ac515dcbcc4a68aa4df0263",
  routeFileCount: 734,
} as const;

/** Cases every L3+ evidence entry must have tested. */
export const REQUIRED_SECURITY_CASES = [
  "anonymous",
  "expired_session",
  "permitted_role",
  "forbidden_role",
  "cross_tenant",
  "mutation",
] as const;

export type RouteAccess =
  | "operator"
  | "role_scoped"
  | "authenticated"
  | "denied_all_roles"
  | "public_auth_flow"
  | "public"
  | "signed_webhook"
  | "cron_secret"
  | "in_route_guard"
  | "environment_gated"
  | "UNKNOWN";

export interface RouteInventoryRecord {
  id: string;
  venture: string;
  kind: "page" | "api";
  url: string;
  sourcePath: string;
  methods: string[];
  dynamicParams: string[];
  parent: string | null;
  canonicalModule: string;
  registryReferences: string[];
  redirectTo: string | null;
  lifecycle: string;
  exposure: "public" | "authenticated" | "internal" | "machine" | "UNKNOWN";
  access: RouteAccess;
  /** proxy = enforced by proxy.ts; static_heuristic = read from source, unverified. */
  accessSource: "proxy" | "static_heuristic" | "none";
  guards: string[];
  roles: string[];
  workspaceGrants: string;
  entitlement: string;
  recordScope: "matter_param" | "matter_data" | "UNKNOWN";
  dataOperations: { tables: string[]; rpcs: string[]; writes: boolean; source: "static_heuristic" };
  rls: "service_role_bypass" | "user_session_rls" | "none_detected";
  dependencies: { directLocal: string[]; directPackages: string[]; transitiveModuleCount: number };
  integrations: string[];
  /** Test files that reference the route; references are not certification. */
  testReferences: string[];
  deployment: string;
  evidenceDate: string | null;
  customer: string;
  revenueLane: string;
  owner: string;
  historical: { inBaseline: boolean; presentAtHead: boolean };
  certification: {
    level: CertificationLevel | "UNKNOWN";
    validEvidence: CertificationLevel[];
    invalidEvidence: { level: string; problems: string[] }[];
    nextLevelBlockers: string[];
  };
}

export interface RouteInventory {
  schemaVersion: number;
  generatedBy: string;
  venture: string;
  historicalBaseline: { commit: string; routeFileCount: number; source: string };
  summary: Record<string, unknown>;
  routes: RouteInventoryRecord[];
}

/**
 * Public API handlers with no recognized guard whose access has not yet been
 * reviewed. Shrink-only: CI fails if a route outside this list is UNKNOWN, or
 * if a listed route is no longer UNKNOWN (remove it once classified).
 */
export const ACCESS_REVIEW_BACKLOG = [
  "api:/api/alliance/submit",
  "api:/api/assistant",
  "api:/api/compliance/[jurisdiction]",
  "api:/api/compliance/country/[country]",
  "api:/api/concierge",
  "api:/api/counsel",
  "api:/api/deals/[id]/apostille",
  "api:/api/health",
  "api:/api/intake",
  "api:/api/intake/analytics",
  "api:/api/intake/extract",
  "api:/api/intake/quote-preview",
  "api:/api/notary/apply",
  "api:/api/policy/active",
  "api:/api/policy/active/[id]",
  "api:/api/portal/check-email",
  "api:/api/portal/confirm",
  "api:/api/portal/verify",
  "api:/api/pricing/request",
  "api:/api/pricing/request/upload",
  "api:/api/professional/profile",
  "api:/api/reviews/request",
  "api:/api/sales/capture",
  "api:/api/verify/[verificationId]",
  "api:/api/webhooks/alliance/credential",
  "api:/api/webhooks/alliance/job",
  "api:/api/webhooks/alliance/toolbelt",
] as const;

/** Loaded lazily so the generated inventory never enters a client bundle. */
export async function loadRouteInventory(): Promise<RouteInventory> {
  const inventory = await import("./routeInventory.generated.json");
  return (inventory.default ?? inventory) as unknown as RouteInventory;
}
