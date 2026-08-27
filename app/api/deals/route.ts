import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { serializeDealMS } from "@/lib/milanoSerialize";

export const runtime = "nodejs";

const DEAL_LIST_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
  "finance",
  "finance_operator",
  "execution_coordinator",
  "apostille_coordinator",
  "client_support",
  "virtual_assistant",
]);

async function requireDealListAccess() {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return { ok: false as const, response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) };
  const role = await resolveServerRole(user);
  if (!DEAL_LIST_ROLES.has(role)) return { ok: false as const, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  return { ok: true as const, role };
}

export async function GET(request: NextRequest) {
  const access = await requireDealListAccess();
  if (!access.ok) return access.response;

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("payment_status");
  const assignee = searchParams.get("assignee");
  const search = searchParams.get("search");
  const requestedLimit = Number(searchParams.get("limit") ?? 100);
  const requestedOffset = Number(searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 500) : 100;
  const offset = Number.isFinite(requestedOffset) ? Math.max(Math.trunc(requestedOffset), 0) : 0;

  let query = supabase
    .from("deals")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (paymentStatus) query = query.eq("payment_status", paymentStatus);
  if (assignee) query = query.eq("assignee", assignee);
  if (search) {
    const q = search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_").slice(0, 160);
    if (q) {
      query = query.or([
        `client_name.ilike.%${q}%`,
        `email.ilike.%${q}%`,
        `deal_id.ilike.%${q}%`,
        `document_type.ilike.%${q}%`,
        `destination_country.ilike.%${q}%`,
        `country.ilike.%${q}%`,
      ].join(","));
    }
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[GET /api/deals]", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 });
  }

  const rows = data ?? [];
  const total = count ?? rows.length;
  const hasMore = offset + rows.length < total;

  return NextResponse.json(rows.map(serializeDealMS), {
    headers: {
      "Cache-Control": "private, no-store",
      "X-Total-Count": String(total),
      "X-Page-Offset": String(offset),
      "X-Page-Limit": String(limit),
      "X-Has-More": hasMore ? "true" : "false",
      ...(hasMore ? { "X-Next-Offset": String(offset + rows.length) } : {}),
    },
  });
}
