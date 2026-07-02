import { NextResponse } from "next/server";

// Sales Intelligence Lab — server-side AI generation. Replaces the source file's
// unsafe browser-side Anthropic call. Uses ANTHROPIC_API_KEY server-side only; if
// the key is missing (or Anthropic errors / returns malformed JSON), returns a
// deterministic fallback. No DB writes, no payment/Wise/release/auth imports, no
// secret exposure. All responses are JSON.

export const runtime = "nodejs";

type Mode = "dm" | "content" | "lead_score";

interface Body {
  mode?: Mode;
  trigger?: string;
  context?: string;
  topic?: string;
  contentType?: string;
  lead?: { name?: string; email?: string; platform?: string; source?: string; message?: string };
}

const NICK = "Nicholas at The Milano Seal";

function fallbackDM(trigger: string, context: string) {
  const ctx = context.trim() || "your international document needs";
  const opener = `Hi — thanks for the ${trigger.toLowerCase()}. I coordinate U.S. document execution and apostille routing for international matters.`;
  const authority = `We handle notarization, RON where eligible, apostille/authentication routing, and secure release — structured for human review, not automated approval.`;
  const pivot = `If you're working on ${ctx}, I can map the execution path (origin, signer location, destination, apostille) before anything is scheduled.`;
  const followup = `Following up in case this is still relevant — happy to review the specifics whenever the timing is right. No pressure.`;
  const full_message = `${opener}\n\n${pivot}\n\n${authority}\n\nWould a short note on the routing be useful? — ${NICK}`;
  return { opener, authority, pivot, followup, full_message };
}

function fallbackContent(contentType: string, topic: string) {
  const t = topic.trim() || "international document execution";
  return {
    hook: `The part of ${t} that quietly derails cross-border matters — and how to get ahead of it.`,
    caption: `International document execution isn't just notarization. It's origin review, signer location, apostille or authentication routing, and receiving-authority requirements — coordinated as one controlled path. The Milano Seal™ handles ${t} end to end. Final acceptance remains subject to the receiving authority.`,
    cta: "Begin Secure Intake",
    hashtags: ["#apostille", "#internationaldocuments", "#poweredbyprecision", "#milanoseal", "#hague"],
    __type: contentType,
  };
}

function fallbackLeadScore(lead: NonNullable<Body["lead"]>) {
  const text = `${lead.message ?? ""} ${lead.source ?? ""} ${lead.platform ?? ""}`.toLowerCase();
  let score = 45;
  const bump = (re: RegExp, n: number) => { if (re.test(text)) score += n; };
  bump(/italy|brazil|uae|dubai|fbi|poa|power of attorney|apostille/i, 20);
  bump(/urgent|rush|asap|deadline/i, 15);
  bump(/attorney|law firm|lawyer|family office|advogad|abogad|studio/i, 18);
  bump(/citizenship|corporate|transaction|estate|succession/i, 8);
  if (/general (inquiry|question)|just (looking|curious)/i.test(text)) score -= 15;
  score = Math.max(1, Math.min(99, score));
  const priority = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  const reasoning = `Deterministic score: ${score}. Weighted on jurisdiction/document signals, urgency, and professional context. Priority ${priority}.`;
  return { score, reasoning, priority: priority as "low" | "medium" | "high" };
}

function safeJson<T>(text: string, fallback: T): T {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const mode = body.mode;
  if (mode !== "dm" && mode !== "content" && mode !== "lead_score") {
    return NextResponse.json({ ok: false, error: "invalid_mode" }, { status: 400 });
  }

  const fallback =
    mode === "dm"
      ? fallbackDM(body.trigger ?? "message", body.context ?? "")
      : mode === "content"
        ? fallbackContent(body.contentType ?? "post", body.topic ?? "")
        : fallbackLeadScore(body.lead ?? {});

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, mode, output: fallback, source: "fallback" });
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: key });
    const system =
      mode === "dm"
        ? `You draft outreach DMs in the voice of ${NICK}: confident, conversational, relationship-first. No legal advice, no guaranteed acceptance, no government-affiliation claims. Return JSON: {opener,authority,pivot,followup,full_message}.`
        : mode === "content"
          ? `You draft premium social content for an international document execution & apostille coordination brand. Attorney/family-office acceptable. No cheap-notary, no government authority, no guaranteed acceptance. Return JSON: {hook,caption,cta,hashtags:[]}.`
          : `You score inbound leads for an international document execution service. Return JSON: {score:number(1-99),reasoning:string,priority:"low"|"medium"|"high"}.`;
    const user =
      mode === "dm"
        ? `Trigger: ${body.trigger}\nContext: ${body.context}`
        : mode === "content"
          ? `Content type: ${body.contentType}\nTopic: ${body.topic}`
          : `Lead: ${JSON.stringify(body.lead)}`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const output = safeJson(text, fallback);
    return NextResponse.json({ ok: true, mode, output, source: "anthropic" });
  } catch {
    return NextResponse.json({ ok: true, mode, output: fallback, source: "fallback" });
  }
}
