import { NextResponse } from "next/server";
import { getWiseBaseUrl, getWiseMode } from "@/lib/wise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issues a real payment-request against Wise (sandbox or prod, whichever
 * WISE_MODE is) using a synthetic deal id, and returns the raw HTTP status +
 * response body. This is the fastest way to find out *why* the intake flow is
 * dropping into the fallback link.
 */
export async function GET() {
  const mode = getWiseMode();
  const base = getWiseBaseUrl();
  const token = process.env.WISE_API_TOKEN?.trim();
  const profileId = process.env.WISE_PROFILE_ID?.trim();

  const report: Record<string, unknown> = {
    mode,
    api_host: base,
    token_set: Boolean(token),
    token_preview: token ? `${token.slice(0, 8)}…${token.slice(-4)}` : null,
    profile_id_set: Boolean(profileId),
    profile_id: profileId ?? null,
  };

  if (!token || !profileId) {
    report.error = "WISE_API_TOKEN or WISE_PROFILE_ID is missing.";
    return NextResponse.json(report);
  }

  // Step 1 — token + profile id sanity check.
  try {
    const profilesRes = await fetch(`${base}/v1/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const profilesText = await profilesRes.text().catch(() => "");
    let profilesParsed: unknown = profilesText;
    try {
      profilesParsed = JSON.parse(profilesText);
    } catch {}
    report.profiles_status = profilesRes.status;
    report.profiles_body = profilesParsed;
    if (Array.isArray(profilesParsed)) {
      const ids = (profilesParsed as Array<{ id: number | string; type?: string }>)
        .map((p) => ({ id: String(p.id), type: p.type }));
      report.profile_ids = ids;
      report.profile_match = ids.some((p) => p.id === profileId);
    }
  } catch (err) {
    report.profiles_error =
      err instanceof Error ? err.message : "Network error fetching /v1/profiles";
    return NextResponse.json(report);
  }

  // Step 2 — actually try to create a payment-request with throwaway data.
  const body = {
    amount: 1,
    currency: "USD",
    description: "Milano Seal sandbox diagnostic — ignore",
    reference: `MS-DIAG-${Date.now().toString().slice(-6)}`,
  };
  report.payment_request_body = body;

  try {
    const res = await fetch(
      `${base}/v3/profiles/${profileId}/payment-requests`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    const text = await res.text().catch(() => "");
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {}
    report.payment_request_status = res.status;
    report.payment_request_ok = res.ok;
    report.payment_request_response = parsed;
    return NextResponse.json(report);
  } catch (err) {
    report.payment_request_error =
      err instanceof Error ? err.message : "Network error";
    return NextResponse.json(report);
  }
}
