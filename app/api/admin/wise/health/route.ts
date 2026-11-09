import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { NextResponse } from "next/server";
import { getWiseBaseUrl } from "@/lib/wise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WiseProfile {
  id: number;
  type: string;
  details?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
  };
}

export async function GET() {
  try {
    const actor = await requireDashboardAccess();
    if (!['founder','founder_admin','admin','finance','finance_operator'].includes(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } }); }
  const base = getWiseBaseUrl();
  const token = process.env.WISE_API_TOKEN?.trim();
  const profileId = process.env.WISE_PROFILE_ID?.trim();

  const baseReport = {
    ok: false,
    api_host: base,
    token_set: Boolean(token),
    profile_id_set: Boolean(profileId),
    configured_profile_id: profileId ?? null,
    profiles: [] as WiseProfile[],
    profile_match: false,
    error: null as string | null,
    hint: null as string | null,
  };

  if (!token) {
    return NextResponse.json({
      ...baseReport,
      hint:
        "Set WISE_API_TOKEN in your .env (live token from wise.com → Settings → API tokens).",
    });
  }

  if (!profileId) {
    return NextResponse.json({
      ...baseReport,
      hint: "Set WISE_PROFILE_ID. You can pick one from the profiles array once the token authenticates.",
    });
  }

  try {
    const res = await fetch(`${base}/v1/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (res.status === 401) {
      return NextResponse.json({
        ...baseReport,
        error: "401 Invalid token",
        hint: "Your token isn't valid. Live tokens come from wise.com → Settings → API tokens.",
      });
    }

    if (!res.ok) {
      await res.body?.cancel();
      return NextResponse.json({
        ...baseReport,
        error: `Wise API ${res.status}: observation unavailable`,
      });
    }

    const profiles = (await res.json()) as WiseProfile[];
    const match = profiles.some((p) => String(p.id) === profileId);

    return NextResponse.json({
      ...baseReport,
      ok: match,
      profiles: profiles.map(profile => ({ id: profile.id, type: profile.type })),
      profile_match: match,
      hint: match
        ? null
        : `WISE_PROFILE_ID=${profileId} not found. Available: ${profiles.map((p) => p.id).join(", ")}`,
    });
  } catch {
    return NextResponse.json({
      ...baseReport,
      error: "WISE_OBSERVATION_UNAVAILABLE",
      hint: `Could not reach Wise. Check that ${base} is reachable from your environment.`,
    });
  }
}
