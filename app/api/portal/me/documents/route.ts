import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("deal_id");
  const ctx = await getCurrentClientDeal(dealId);
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.deal) return NextResponse.json({ files: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("files")
    .select("*")
    .eq("deal_id", ctx.deal.id)
    .order("created_at", { ascending: false });

  if (!data?.length) return NextResponse.json({ files: [] });

  const files = await Promise.all(
    data.map(async (f) => {
      if (!f.storage_path) return f;
      const { data: signed } = await admin.storage
        .from("deal-documents")
        .createSignedUrl(f.storage_path, 3600);
      return { ...f, url: signed?.signedUrl ?? null };
    }),
  );

  return NextResponse.json({ files });
}
