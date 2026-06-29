import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getHomeRouteForRole, isRouteAllowedForRole } from "@/lib/auth/roleRedirect";

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

  if (pathname.startsWith("/dashboard/alliance")) {
    const allianceUrl = request.nextUrl.clone();
    allianceUrl.pathname = "/alliance/dashboard";
    return NextResponse.redirect(allianceUrl);
  }

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
    return NextResponse.next();
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

  const role = ((user.app_metadata?.role ?? user.user_metadata?.role) as string | undefined) ?? null;

  if (!pathname.startsWith("/api/") && !isRouteAllowedForRole(pathname, role)) {
    const roleUrl = request.nextUrl.clone();
    roleUrl.pathname = getHomeRouteForRole(role);
    roleUrl.search = "";
    return NextResponse.redirect(roleUrl);
  }

  if (pathname.startsWith("/api/dashboard") && !isRouteAllowedForRole("/dashboard", role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (pathname.startsWith("/api/va") && !isRouteAllowedForRole("/va/dashboard", role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
