// /api/assistant — the public Milano Execution Copilot (mounted site-wide from
// app/layout.tsx; anonymous access is intended).
//
// Because every accepted request costs a paid model call, every refusal below
// happens BEFORE the provider is contacted:
//   - owner off-switch:      ASSISTANT_ENABLED=false            -> 503
//   - provider unconfigured: no ANTHROPIC_API_KEY               -> 503
//   - cross-site callers (the widget is same-origin only)       -> 403
//   - oversized body / message / context                        -> 413
//   - malformed JSON                                            -> 400
//   - durable per-client / global daily limit (Postgres RPC)    -> 429 + Retry-After
//     (limiter unavailable -> 503: fail closed)
// Output is bounded by ASSISTANT_MAX_OUTPUT_TOKENS. The model is never given
// server data: context is client-supplied and reduced to a per-role allow-list.

import { NextResponse } from "next/server";
import { ROLE_PROMPT_REGISTRY, type AssistantRoleMode } from "@/lib/assistant/assistantPrompts";
import { enforceSecureProjection, sanitizeTextPayload } from "@/lib/assistant/assistantSafety";
import { retryAfterHeaders, type RequestLimitDecision } from "@/lib/security/publicRequestLimit";
import { isSameOriginRequest } from "@/lib/security/sameOriginRequest";

export const ASSISTANT_MODEL = "claude-haiku-4-5-20251001";
export const ASSISTANT_MAX_OUTPUT_TOKENS = 512;
export const ASSISTANT_MAX_BODY_BYTES = 8 * 1024;
export const ASSISTANT_MAX_MESSAGE_CHARS = 2000;
export const ASSISTANT_MAX_CONTEXT_CHARS = 2000;

const ROLE_MODES = ["PUBLIC", "PORTAL", "DASHBOARD", "ALLIANCE", "VA"] as const;
const EMPTY_PROMPT_REPLY =
  "Tell me the destination country or the document you are working with, and I can help structure the next operational step.";
const RATE_LIMITED_REPLY = "The Copilot is receiving many questions right now. Please try again in a few minutes, or continue to secure intake.";
const UNAVAILABLE_REPLY = "The Milano Execution Copilot is temporarily unavailable. Please try again shortly.";

export interface AssistantProviderRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: { role: "user"; content: string }[];
}

export interface AssistantDeps {
  /** Durable per-client and global daily limit, consumed only for a request that reaches the provider. */
  limit: (request: Request) => Promise<RequestLimitDecision>;
  /** Calls the model provider. Only reached after every guard passes. */
  createMessage: (request: AssistantProviderRequest) => Promise<{ content: { type: string; text?: string }[] }>;
  env: Record<string, string | undefined>;
}

const TOO_LONG_REPLY = `Please shorten your message to ${ASSISTANT_MAX_MESSAGE_CHARS.toLocaleString("en-US")} characters or fewer.`;

// Every refusal carries a readable `reply` (both widgets render it) and a code.
function refuse(status: 400 | 403 | 413 | 503, code: string) {
  const reply = status === 413 ? TOO_LONG_REPLY : UNAVAILABLE_REPLY;
  return NextResponse.json({ reply, code }, { status, headers: { "Cache-Control": "no-store" } });
}

function allowedContextKeys(mode: AssistantRoleMode): string[] {
  switch (mode) {
    case "PUBLIC":
      return ["pathname", "search", "label", "country", "destination_country", "document_type", "origin_state", "signer_location"];
    case "PORTAL":
      return ["matter_id", "status", "current_step", "next_action", "estimated_timeline", "pathname", "label"];
    case "DASHBOARD":
      return ["matter_id", "status", "signer_name", "destination_country", "payment_status", "blocking_reason", "step_notes"];
    case "ALLIANCE":
      return ["referral_id", "matter_status", "referred_at", "commission_status"];
    case "VA":
      return ["task_id", "task_type", "assigned_to", "due_date", "status", "matter_id"];
    default:
      return [];
  }
}

export async function handleAssistantRequest(request: Request, deps: AssistantDeps): Promise<NextResponse> {
  if (deps.env.ASSISTANT_ENABLED?.trim().toLowerCase() === "false") return refuse(503, "ASSISTANT_DISABLED");
  if (!deps.env.ANTHROPIC_API_KEY?.trim()) return refuse(503, "ASSISTANT_UNCONFIGURED");
  if (!isSameOriginRequest(request)) return refuse(403, "ASSISTANT_CROSS_SITE_REFUSED");

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > ASSISTANT_MAX_BODY_BYTES) return refuse(413, "ASSISTANT_PAYLOAD_TOO_LARGE");
  const raw = await request.text().catch(() => "");
  if (Buffer.byteLength(raw, "utf8") > ASSISTANT_MAX_BODY_BYTES) return refuse(413, "ASSISTANT_PAYLOAD_TOO_LARGE");

  let body: { message?: unknown; role?: unknown; context?: unknown };
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return refuse(400, "ASSISTANT_INVALID_JSON");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return refuse(400, "ASSISTANT_INVALID_JSON");

  const message = typeof body.message === "string" ? body.message : "";
  if (message.length > ASSISTANT_MAX_MESSAGE_CHARS) return refuse(413, "ASSISTANT_MESSAGE_TOO_LONG");
  const safeMessage = sanitizeTextPayload(message).trim();
  if (!safeMessage) return NextResponse.json({ reply: EMPTY_PROMPT_REPLY });

  const mode: AssistantRoleMode = (ROLE_MODES as readonly unknown[]).includes(body.role)
    ? (body.role as AssistantRoleMode)
    : "PUBLIC";
  let contextBlock = "";
  if (body.context && typeof body.context === "object" && !Array.isArray(body.context)) {
    const safeContext = enforceSecureProjection(body.context as Record<string, unknown>, allowedContextKeys(mode));
    if (Object.keys(safeContext).length > 0) {
      const serialized = JSON.stringify(safeContext);
      if (serialized.length > ASSISTANT_MAX_CONTEXT_CHARS) return refuse(413, "ASSISTANT_CONTEXT_TOO_LARGE");
      contextBlock = `\n\nSafe interface context: ${serialized}`;
    }
  }

  // Durable limits last: malformed or oversized requests never consume a caller's allowance.
  const decision = await deps.limit(request);
  if (!decision.allowed) {
    if (decision.status === 503) return refuse(503, "ASSISTANT_LIMIT_UNAVAILABLE");
    return NextResponse.json(
      { reply: RATE_LIMITED_REPLY, code: "ASSISTANT_RATE_LIMITED" },
      { status: 429, headers: { "Cache-Control": "no-store", ...retryAfterHeaders(decision) } },
    );
  }

  try {
    const response = await deps.createMessage({
      model: ASSISTANT_MODEL,
      max_tokens: ASSISTANT_MAX_OUTPUT_TOKENS,
      system: ROLE_PROMPT_REGISTRY[mode].systemPrompt + contextBlock,
      messages: [{ role: "user", content: safeMessage }],
    });
    const first = response.content[0];
    const text = first?.type === "text" && typeof first.text === "string" ? first.text : "";
    return NextResponse.json({ reply: sanitizeTextPayload(text) });
  } catch {
    return NextResponse.json({ reply: UNAVAILABLE_REPLY }, { status: 500 });
  }
}
