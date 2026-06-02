import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleFromEmail } from "@/lib/rbac";
import { audit } from "@/lib/audit";

// SECURITY-05: Operator-only AI parse endpoint.
// API key never leaves the server. System prompts contain internal pricing — never expose to client.

const SYS_INTAKE = `You are the intake engine for THE MILANO SEAL™ — a premier international document execution firm in Florida.

When a client inquiry arrives, extract all relevant details and return a complete structured intake record.

Internal pricing reference (DO NOT include in client-facing output — internal only):
- Signature Package: $750 (notarization + authentication, single document, single signer, domestic)
- Priority Package: $975 (+ priority processing + courier coordination)
- Executive Package: $1,850 (multi-document, multi-signer, international, white glove)
- Extra documents: +$75 each
- Extra signers: +$150 each
- Apostille (first): +$250, each additional: +$150
- International signers: +$200
- Expedited processing: +$200
- Urgent/same-day: +$400
- Weekend service: +$250

Return ONLY valid JSON (no markdown, no explanation):
{
  "mode": "intake",
  "deal_id": "MS-2026-XXXX",
  "confidence_score": 0.85,
  "invoice_ready": true,
  "client": {
    "name": "",
    "email": "",
    "phone": "",
    "location": ""
  },
  "matter": {
    "document_type": "",
    "destination_country": "",
    "signer_count": 1,
    "document_count": 1,
    "apostille_needed": false,
    "translation_needed": false,
    "urgency": "standard"
  },
  "classification": {
    "package": "Signature",
    "service_lane": "",
    "hague_applicable": true
  },
  "pricing": {
    "base": 750,
    "add_ons": [],
    "total": 750,
    "retainer": 375,
    "balance": 375
  },
  "invoice": {
    "line_items": [],
    "subtotal": 750,
    "retainer_due": 375,
    "balance_due": 375,
    "payment_note": ""
  },
  "response_script": "",
  "next_action": "",
  "follow_up_hours": 24,
  "notes": ""
}`;

const SYS_COMP = `You are a competitive intelligence analyst for THE MILANO SEAL™, an international apostille and document execution firm.

Analyze the competitor or social media account provided and return ONLY valid JSON:
{
  "mode": "competitor",
  "account": "",
  "handle": "",
  "industry": "",
  "relevance": "HIGH",
  "threat_level": "LOW",
  "services_overlap": [],
  "estimated_volume": "",
  "pricing_intel": "",
  "geographic_focus": [],
  "weaknesses": [],
  "opportunities": [],
  "recommended_action": "",
  "notes": ""
}`;

const SYS_ACQ = `You are the acquisition intelligence engine for THE MILANO SEAL™.

Analyze the acquisition target or outreach prospect and return ONLY valid JSON:
{
  "mode": "acquisition",
  "target": "",
  "type": "attorney",
  "location": "",
  "likelihood_score": 8,
  "referral_potential": "HIGH",
  "estimated_volume_per_month": 0,
  "contact_channel": "email",
  "opening_message": "",
  "value_proposition": "",
  "objection_handling": "",
  "recommended_next_step": "",
  "notes": ""
}`;

const SYS_CONTENT = `You are the content strategist for THE MILANO SEAL™ — a luxury international document execution brand.

Generate authority content for the given topic and return ONLY valid JSON:
{
  "mode": "content",
  "hook": "",
  "concept": "",
  "caption": "",
  "hashtags": [],
  "cta": "",
  "content_type": "reel",
  "platform": "instagram",
  "instagram_caption": "",
  "linkedin_caption": "",
  "authority_angle": "",
  "visual_direction": ""
}`;

const SYS_INTEL = `You are the market intelligence engine for THE MILANO SEAL™.

Analyze the signal or news item provided and return ONLY valid JSON:
{
  "mode": "intelligence",
  "signal_type": "",
  "region": "",
  "impact_level": "HIGH",
  "summary": "",
  "impact_on_clients": "",
  "impact_on_operations": "",
  "recommended_action": "",
  "urgency_tag": "MONITOR",
  "source_type": "",
  "notes": ""
}`;

const SYSTEM_PROMPTS: Record<string, string> = {
  INTAKE: SYS_INTAKE,
  COMPETITOR: SYS_COMP,
  ACQUISITION: SYS_ACQ,
  CONTENT: SYS_CONTENT,
  INTELLIGENCE: SYS_INTEL,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = roleFromEmail(user.email);
    if (role !== "operator" && role !== "admin") {
      try {
        await audit({
          event: "resource.access.denied",
          actor: user.email,
          resource: "ai:parse",
          payload: {
            actorKind: "client",
            reason: "insufficient role for AI parse endpoint",
            action: "denied",
            status: "failure",
          },
        });
      } catch {
        // Logging failure must never block production flow
      }
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const input: string = body.input ?? "";
    const mode: string = (body.mode ?? "INTAKE").toUpperCase();

    if (!input.trim()) {
      return NextResponse.json({ error: "input required" }, { status: 400 });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "AI not configured — add ANTHROPIC_API_KEY to environment" },
        { status: 503 }
      );
    }

    const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYS_INTAKE;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: input }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "Anthropic API error", detail: errText },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";

    try {
      const clean = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(clean);
      return NextResponse.json({ success: true, mode, parsed, raw: text });
    } catch {
      return NextResponse.json({ success: true, mode, parsed: null, raw: text });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
