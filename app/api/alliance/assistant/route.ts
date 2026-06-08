import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["alliance_partner", "founder_admin", "admin_operator"];

// System prompt built entirely server-side — operator cannot inject or override it.
function buildAllianceSystemPrompt(
  operatorName: string | null,
  region: string | null,
  capabilities: string[],
): string {
  const capList =
    capabilities.length > 0
      ? capabilities.join(", ")
      : "general document execution";

  return `You are the Alliance Assistant™ — an operational coordination AI for The Milano Seal™ Alliance Network.

You are speaking with ${operatorName ?? "an alliance operator"}${region ? `, based in ${region}` : ""}.

Their verified execution capabilities include: ${capList}.

Your role:
- Provide procedural execution guidance for assigned matters
- Explain document requirements for international destinations
- Offer scheduling coordination advice
- Remind about upload and documentation requirements
- Help interpret execution instructions clearly
- Provide destination-specific procedural context (apostille, legalization, translation requirements)
- Explain Hague Convention apostille workflows across member countries

Tone rules:
- Calm, institutional, procedural — like an experienced international document coordinator
- Clear and practical — never legal advice
- Never guarantee outcomes or timelines
- Never share client PII, internal pricing, margins, or platform financials
- Never speculate about matters outside the operator's assigned work
- For legal questions: refer to the coordinator at The Milano Seal
- For payment or commission questions: refer to the Payouts section or their Milano Seal coordinator
- Never say "approved by the embassy", "guaranteed", "legally required" — use "typically required" or "generally expected"

Response: maximum 120 words. Operational, specific, reassuring. No headers unless genuinely helpful.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt =
    typeof body.prompt === "string" ? body.prompt.trim().slice(0, 800) : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 422 });
  }

  const admin = createAdminClient();

  // Fetch operator context for system prompt — no sensitive financial data
  const { data: profile } = await admin
    .from("operator_profiles")
    .select(
      "full_name, region, state, ron_capable, mobile_capable, apostille_runner_capable, courier_capable",
    )
    .eq("id", user.id)
    .single();

  const capabilities: string[] = [];
  if (profile?.ron_capable) capabilities.push("Remote Online Notarization");
  if (profile?.mobile_capable) capabilities.push("Mobile Notarization");
  if (profile?.apostille_runner_capable) capabilities.push("Apostille Submission");
  if (profile?.courier_capable) capabilities.push("Courier Coordination");

  const system = buildAllianceSystemPrompt(
    profile?.full_name ?? null,
    profile?.region ?? profile?.state ?? null,
    capabilities,
  );

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "AI service error" }, { status: 502 });
  }

  const ai = (await res.json()) as {
    content?: { type: string; text: string }[];
  };
  const reply = ai.content?.find((c) => c.type === "text")?.text ?? "";

  return NextResponse.json({ reply });
}
