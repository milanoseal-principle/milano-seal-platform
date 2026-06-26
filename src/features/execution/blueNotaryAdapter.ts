export interface BlueNotarySessionInput {
  matterId: string;
  signerEmail?: string;
  signerName?: string;
  callbackUrl?: string;
}

export interface BlueNotarySessionResult {
  mode: "api" | "manual";
  status: "scheduled" | "manual_coordination_required";
  session_id?: string;
  session_url?: string;
  message: string;
}

function configReady() {
  return Boolean(process.env.BLUENOTARY_API_KEY && process.env.BLUENOTARY_BASE_URL);
}

export async function createSession(input: BlueNotarySessionInput): Promise<BlueNotarySessionResult> {
  if (!configReady()) {
    return {
      mode: "manual",
      status: "manual_coordination_required",
      message: "Manual RON coordination mode. BlueNotary API is not configured.",
    };
  }

  const response = await fetch(`${process.env.BLUENOTARY_BASE_URL}/sessions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.BLUENOTARY_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error("BlueNotary session creation failed.");
  const data = (await response.json()) as { id?: string; url?: string };
  return { mode: "api", status: "scheduled", session_id: data.id, session_url: data.url, message: "BlueNotary session scheduled." };
}

export async function getSession(sessionId: string) {
  if (!configReady()) return { mode: "manual", status: "manual_coordination_required" };
  const response = await fetch(`${process.env.BLUENOTARY_BASE_URL}/sessions/${sessionId}`, {
    headers: { authorization: `Bearer ${process.env.BLUENOTARY_API_KEY}` },
  });
  if (!response.ok) throw new Error("BlueNotary session lookup failed.");
  return response.json();
}

export async function cancelSession(sessionId: string) {
  if (!configReady()) return { mode: "manual", status: "manual_coordination_required" };
  const response = await fetch(`${process.env.BLUENOTARY_BASE_URL}/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${process.env.BLUENOTARY_API_KEY}` },
  });
  if (!response.ok) throw new Error("BlueNotary session cancellation failed.");
  return { canceled: true };
}

export function handleWebhook(payload: Record<string, unknown>) {
  return {
    provider: "BlueNotary",
    status: payload.status ?? "manual_review",
    session_id: payload.id ?? payload.session_id,
  };
}
