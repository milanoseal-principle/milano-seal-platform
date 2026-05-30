import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["admin", "ops_manager"]);

export async function GET() {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();

    const { data: shipments, error } = await admin
      .from("deals")
      .select(
        "id, deal_id, client_name, destination_country, carrier, tracking_number, delivery_status, delivery_eta, shipped_at, deal_status",
      )
      .eq("deal_status", "shipped")
      .order("shipped_at", { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json({ shipments: [] });
    }

    // Filter to active (not delivered, has tracking)
    const active = (shipments ?? []).filter(
      (s) => s.tracking_number && s.delivery_status !== "delivered",
    );

    return NextResponse.json({ shipments: active });
  } catch {
    return NextResponse.json({ shipments: [] });
  }
}
