import { supabaseServer } from "@/lib/supabaseServer";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Service-role Matter insert: operators only, never anonymous.
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  try {
    const body = await req.json();

    const { data, error } = await supabaseServer()
      .from("deals")
      .insert([
        {
          document_type: body.documentType || "unknown",
          total_price: 750,
          status: "new",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return Response.json({ success: true, deal: data });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
