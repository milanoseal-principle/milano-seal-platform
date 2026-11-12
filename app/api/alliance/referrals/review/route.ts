import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";

export async function POST(req: NextRequest) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  try {
    let id: string | null = null;
    let action: string | null = null;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      id = body.id;
      action = body.action;
    } else {
      const form = await req.formData();
      id = form.get("id") as string | null;
      action = form.get("action") as string | null;
    }

    if (!id || !action) {
      return NextResponse.json({ error: "Missing id or action." }, { status: 400 });
    }

    const supabase = createAdminClient();

    if (action === "accept") {
      await supabase
        .from("partner_observations")
        .update({ status: "accepted" })
        .eq("id", id);
    } else if (action === "reject") {
      await supabase
        .from("partner_observations")
        .update({ status: "rejected" })
        .eq("id", id);
    } else if (action === "convert") {
      // Fetch the original observation
      const { data: obs } = await supabase
        .from("partner_observations")
        .select("partner_id, country, document_type, observation_text")
        .eq("id", id)
        .single();

      if (obs) {
        // Extract authority note from observation_text
        const authorityLine = (obs.observation_text ?? "").split("\n\n").find((s: string) =>
          s.toLowerCase().startsWith("authority note:")
        );
        const authorityText = authorityLine
          ? authorityLine.replace(/^authority note:\s*/i, "").trim()
          : obs.observation_text;

        await supabase.from("partner_observations").insert({
          partner_id: obs.partner_id,
          observation_type: "authority_observation",
          observation_text: authorityText,
          country: obs.country,
          document_type: obs.document_type,
          status: "pending_review",
        });
      }
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    // Redirect back to operator referral review page
    return NextResponse.redirect(new URL("/dashboard/alliance/referrals", req.url));
  } catch {
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
