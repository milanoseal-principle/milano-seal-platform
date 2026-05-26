import { NextRequest, NextResponse } from "next/server";
import { getCurrentClientDeal } from "@/lib/portalAuth";

export const runtime = "nodejs";

// Client-safe status labels — never expose internal stage names to AI context
const CLIENT_STATUS_LABELS: Record<string, string> = {
  new: "received and being set up",
  intake_received: "received and under initial review",
  under_review: "under procedural review",
  compliance_review: "under review",
  quoted: "a proposal has been issued",
  awaiting_payment: "awaiting your payment to proceed",
  payment_confirmed: "payment confirmed — scheduling is in progress",
  scheduled: "scheduled for your execution session",
  in_execution: "in the execution phase",
  apostille_processing: "being processed for apostille authentication",
  courier_ready: "packaged and ready for courier dispatch",
  shipped: "on its way to the destination",
  delivered: "delivered",
  completed: "complete",
  closed: "complete",
};

function buildClientSystemPrompt(
  documentType: string | null,
  destinationCountry: string | null,
  matterStatus: string | null,
  paymentStatus: string | null,
): string {
  const safeStatus =
    CLIENT_STATUS_LABELS[matterStatus ?? ""] ?? "being processed";
  const paymentLabel =
    paymentStatus === "paid" || paymentStatus === "confirmed"
      ? "confirmed"
      : "pending";

  const ctx: string[] = [];
  if (documentType) ctx.push(`Document type: ${documentType}.`);
  if (destinationCountry) ctx.push(`Destination: ${destinationCountry}.`);
  ctx.push(`Current status: ${safeStatus}.`);
  ctx.push(`Payment: ${paymentLabel}.`);

  return `You are a matter guide for The Milano Seal™ — a professional international document execution service.

You are helping a client understand their document journey. Be warm, calm, and reassuring.

${ctx.length ? `Matter context:\n${ctx.join("\n")}\n` : ""}
Tone rules:
- Simple, clear language — no legal jargon, no internal system terminology
- Never say "approved", "guaranteed", "confirmed by government", "embassy verified", or "legal requirement confirmed"
- Never quote fees, pricing, or costs
- Never mention internal stage names, case IDs, operator notes, or processing details
- If asked about timing: explain it varies by destination and document type, and their coordinator will follow up with specifics
- If asked for legal advice: politely note that you can explain the process, but recommend they speak with their coordinator for guidance specific to their situation
- For apostille questions: explain it as an internationally recognized authentication seal based on the Hague Convention — use "appears to be required" or "is typically needed" not "is required by law"
- Refer to their coordinator for any scheduling, payment, or next-step specifics

Response: maximum 80 words. Conversational and reassuring. No headers or lists unless genuinely helpful.`;
}

export async function POST(req: NextRequest) {
  try {
    // Requires authenticated portal session — no operator or admin access via this route
    const ctx = await getCurrentClientDeal();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { prompt?: unknown };
    const prompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "AI not configured" },
        { status: 503 },
      );
    }

    // System prompt is built server-side from safe deal fields only.
    // The client cannot inject or override the system prompt.
    const system = buildClientSystemPrompt(
      ctx.deal?.document_type ?? null,
      ctx.deal?.destination_country ?? null,
      ctx.deal?.status ?? null,
      ctx.deal?.payment_status ?? null,
    );

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = (await res.json()) as {
      content?: Array<{ text: string }>;
    };
    const text = data.content?.[0]?.text ?? "";

    return NextResponse.json({ success: true, text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
