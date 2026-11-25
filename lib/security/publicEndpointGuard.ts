import { defaultRequestLimiterDeps, enforcePublicRequestLimit, retryAfterHeaders } from "@/lib/security/publicRequestLimit";
import { isSameOriginRequest } from "@/lib/security/sameOriginRequest";

export async function guardPublicEndpoint(
  request: Request,
  bucket: "verify_lookup" | "public_signup",
): Promise<Response | null> {
  if (bucket === "public_signup" && !isSameOriginRequest(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  const deps = await defaultRequestLimiterDeps();
  const result = await enforcePublicRequestLimit(request, { client: bucket }, deps);
  if (result.allowed) return null;

  return Response.json(
    { error: result.status === 429 ? "Too many requests. Please try again later." : "Service temporarily unavailable." },
    { status: result.status, headers: { "Cache-Control": "no-store", ...retryAfterHeaders(result) } },
  );
}
