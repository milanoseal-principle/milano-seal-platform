// Same-origin check for public endpoints that only the site's own pages call.
//
// Browsers send Origin on every POST fetch and Sec-Fetch-Site on modern
// engines. A request is accepted only when its Origin equals the request's own
// origin, or (no Origin) when the browser reports a same-origin fetch. This
// blocks cross-site use of a public endpoint from other web pages; it does not
// authenticate a non-browser client, so cost-bearing endpoints must still cap
// their own work.

export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
