import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getHomeRouteForRole, isRouteAllowedForRole } from "@/lib/auth/roleRedirect";
import { isAccountDisabled } from "@/lib/auth/server-role";
import { localeFromPathname, resolveLocale } from "@/lib/i18n/resolveLocale";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/portal",
  "/alliance",
  "/va",
  "/internal",
  "/ops",
  "/workspace",
  "/admin",
  "/api/admin",
  "/api/dashboard",
  "/api/follow-ups",
  "/api/compliance/list",
  "/api/portal/me",
  "/api/va",
  "/professional/matters",
  "/professional/account",
  "/api/professional/matters",
  "/api/professional/account",
  "/api/professional/handoff",
];

const PUBLIC_AUTH_PATHS = new Set([
  "/login",
  "/admin/login",
  "/operator/login",
  "/auth/callback",
]);

// Prefix-match for auth paths that have dynamic suffixes
const PUBLIC_AUTH_PREFIXES = ["/auth/", "/api/auth/"];

// Public conversion funnel paths that live under otherwise-protected prefixes.
const PUBLIC_FUNNEL_PATHS = new Set(["/alliance/apply", "/va/apply"]);

function isProtected(pathname: string): boolean {
  if (PUBLIC_FUNNEL_PATHS.has(pathname)) return false;
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // NOTE: /dashboard/alliance is the operator/founder ALLIANCE OVERSIGHT surface
  // (aggregate partner + assignment view) and must stay reachable for founder/admin
  // oversight — it is intentionally NOT redirected to the partner portal
  // (/alliance/dashboard). Role access is enforced below via isRouteAllowedForRole.

  // Founder production ledger test runner: allow secret-authenticated server-to-
  // server calls (from SQL/terminal, no browser cookie) to pass the edge session
  // gate. The route itself still verifies the secret, the confirmation token, and
  // the test-matter guard before doing anything.
  const testRunnerSecret = process.env.PRODUCTION_TEST_SECRET;
  if (
    pathname === "/api/admin/tests/production-matter-ledger" &&
    testRunnerSecret &&
    request.headers.get("x-test-runner-secret") === testRunnerSecret
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_AUTH_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_AUTH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (!isProtected(pathname)) {
    const publicResponse = NextResponse.next({ request });
    if (!pathname.startsWith("/api/") && !pathname.startsWith("/webhooks/")) {
      publicResponse.headers.set("x-tms-locale", resolveLocale({
        pathLocale: localeFromPathname(pathname),
        cookieLocale: request.cookies.get("tms_locale")?.value,
        acceptLanguage: request.headers.get("accept-language"),
      }));
    }
    return publicResponse;
  }

  let response = NextResponse.next({ request });
  // Inject current pathname so server layouts can redirect with route-specific next= params
  response.headers.set("x-pathname", pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(loginUrl);
  }

  // Authorization role comes ONLY from app_metadata (service-role controlled).
  // user_metadata is user-writable and must never be consulted here. A disabled
  // account resolves to no role and is blocked like a missing role.
  const role = isAccountDisabled(user)
    ? null
    : (user.app_metadata?.role as string | undefined) ?? null;

  if (!pathname.startsWith("/api/") && !isRouteAllowedForRole(pathname, role)) {
    // getHomeRouteForRole may include a query (e.g. the denied route), so build
    // the redirect from a full URL rather than assigning pathname directly.
    const target = getHomeRouteForRole(role);
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Operator APIs: a signed-in session alone is not enough. /api/admin and
  // /api/follow-ups expose and mutate cross-Matter data with the service-role
  // client, so they require the same operator family as /api/dashboard.
  if (
    (pathname.startsWith("/api/dashboard") ||
      pathname === "/api/admin" ||
      pathname.startsWith("/api/admin/") ||
      pathname === "/api/follow-ups" ||
      pathname.startsWith("/api/follow-ups/")) &&
    !isRouteAllowedForRole("/dashboard", role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (pathname.startsWith("/api/va") && !isRouteAllowedForRole("/va/dashboard", role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    (pathname.startsWith("/api/professional/matters") ||
      pathname.startsWith("/api/professional/account") ||
      pathname.startsWith("/api/professional/handoff")) &&
    !isRouteAllowedForRole("/professional/matters", role)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
