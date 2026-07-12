import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";

export const dynamic = "force-dynamic";

const VA_SYSTEM_PROMPT = `You are the Milano Seal™ VA Assistant — a precision operations guide for virtual assistants working within The Milano Seal™ notarial and document authentication platform.

Your role is to help VAs with:
- Understanding task requirements and document workflows
- Navigating apostille, authentication, and courier coordination processes
- Clarifying client communication protocols
- Escalation procedures and compliance checkpoints
- Status tracking and matter coordination

Rules:
- Only advise on legitimate notarial, authentication, and document coordination tasks
- Never reveal internal pricing, margins, or financial data
- Never share client PII beyond what is operationally necessary for the current task
- Refer complex legal questions to supervising operators or escalation coordinators
- Keep responses concise and operationally focused
- If a task is outside your scope, say so clearly and recommend escalation`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!isVARole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let message = "";
  try {
    const body = await request.json();
    message = typeof body?.message === "string" ? body.message.slice(0, 2000) : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!message.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Assistant unavailable" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: VA_SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Assistant request failed" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      content?: { type: string; text: string }[];
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";

    return NextResponse.json({ reply: text });
  } catch {
    return NextResponse.json(
      { error: "Assistant unavailable" },
      { status: 503 }
    );
  }
}
