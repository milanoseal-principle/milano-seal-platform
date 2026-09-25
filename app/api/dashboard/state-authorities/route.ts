import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import {
  AUTHORITY_ASSET_FIELDS,
  STATE_AUTHORITY_FIELDS,
  evaluateStateAuthority,
  resolveOfficialAsset,
  type AuthoritySourceAsset,
  type StateAuthorityRecord,
} from "@/lib/intelligence/execution-brain/stateAuthorityProvenance";

export const runtime = "nodejs";

// Internal operator read: state authority provenance with the effective
// (recomputed) status and the resolved official form per authority.
export async function GET() {
  await requireDashboardAccess();
  const supabase = createAdminClient();
  const [{ data: authorities, error }, { data: assets }] = await Promise.all([
    supabase.from("state_authorities").select(STATE_AUTHORITY_FIELDS).order("state_code"),
    supabase.from("authority_source_assets").select(AUTHORITY_ASSET_FIELDS),
  ]);
  if (error) return NextResponse.json({ error: "STATE_AUTHORITIES_UNAVAILABLE" }, { status: 500 });

  const now = new Date();
  const rows = ((authorities ?? []) as unknown as StateAuthorityRecord[]).map((authority) => ({
    authority,
    evaluation: evaluateStateAuthority(authority, now),
    officialForm: resolveOfficialAsset((assets ?? []) as AuthoritySourceAsset[], {
      authorityId: authority.id ?? undefined,
    }),
  }));
  return NextResponse.json({ authorities: rows });
}
