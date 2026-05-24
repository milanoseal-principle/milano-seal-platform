import crypto from "crypto";

export interface BusEvent<TPayload = Record<string, unknown>> {
  event: string;
  payload: TPayload;
  ts?: string;
}

function signBody(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export async function emitEvent<T = Record<string, unknown>>(
  event: string,
  payload: T,
): Promise<boolean> {
  const url = process.env.WEBHOOK_URL;
  if (!url) return false;

  const body: BusEvent<T> = {
    event,
    payload,
    ts: new Date().toISOString(),
  };
  const json = JSON.stringify(body);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Milano-Event": event,
  };

  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    headers["X-Milano-Signature"] = signBody(secret, json);
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: json,
    });
    return res.ok;
  } catch (err) {
    console.error(
      "[webhookBus] emit failed:",
      err instanceof Error ? err.message : err,
    );
    return false;
  }
}
