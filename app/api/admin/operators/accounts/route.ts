import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listBindingAccounts, requireBindingAdmin } from "@/lib/alliance/accountBinding";

export const runtime = "nodejs";

// GET — Alliance accounts with their binding state, and the operator profiles available to bind.
export async function GET() {
  const access = await requireBindingAdmin();
  if (!access.ok) return access.response;
  try {
    return NextResponse.json(await listBindingAccounts(createAdminClient()));
  } catch {
    return NextResponse.json({ error: "BINDING_ACCOUNTS_UNAVAILABLE" }, { status: 503 });
  }
}
