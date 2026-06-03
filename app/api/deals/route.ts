import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serializeDealMS } from "@/lib/milanoSerialize";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("payment_status");
  const assignee = searchParams.get("assignee");
  const search = searchParams.get("search");
  const limit = Number(searchParams.get("limit") ?? 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  let query = supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (paymentStatus) {
    query = query.eq("payment_status", paymentStatus);
  }
  if (assignee) query = query.eq("assignee", assignee);
  if (search) {
    const q = search.trim();
    query = query.or(
      [
        `client_name.ilike.%${q}%`,
        `email.ilike.%${q}%`,
        `deal_id.ilike.%${q}%`,
        `document_type.ilike.%${q}%`,
        `destination_country.ilike.%${q}%`,
        `country.ilike.%${q}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/deals]", error);
    return NextResponse.json(
      { error: "Failed to fetch deals" },
      { status: 500 }
    );
  }

  return NextResponse.json((data ?? []).map(serializeDealMS));
}
