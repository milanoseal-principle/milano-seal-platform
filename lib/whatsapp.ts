import { createAdminClient } from "@/lib/supabase/admin";

interface SendOptions {
  dealId?: string | null;
  direction?: "outbound" | "inbound";
}

function normalizeWhatsAppAddress(addr: string): string {
  return addr.startsWith("whatsapp:") ? addr : `whatsapp:${addr}`;
}

export async function sendWhatsApp(
  to: string,
  body: string,
  opts: SendOptions = {},
): Promise<{ ok: boolean; sid?: string; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!sid || !token || !from) {
    console.warn("[whatsapp] missing Twilio credentials — skipping send");
    return { ok: false, error: "Missing Twilio env vars" };
  }

  const fromAddr = normalizeWhatsAppAddress(from);
  const toAddr = normalizeWhatsAppAddress(to);

  let twilio_sid: string | undefined;
  let status: "sent" | "failed" = "failed";
  let errorMsg: string | undefined;

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString(
            "base64",
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: toAddr,
          From: fromAddr,
          Body: body,
        }).toString(),
      },
    );

    if (res.ok) {
      const data = (await res.json()) as { sid?: string };
      twilio_sid = data.sid;
      status = "sent";
    } else {
      errorMsg = `Twilio HTTP ${res.status}`;
      try {
        const errJson = (await res.json()) as { message?: string };
        if (errJson.message) errorMsg = errJson.message;
      } catch {}
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  if (opts.dealId) {
    try {
      const supabase = createAdminClient();
      await supabase.from("messages").insert({
        deal_id: opts.dealId,
        direction: opts.direction ?? "outbound",
        channel: "whatsapp",
        content: body,
        status,
        twilio_sid: twilio_sid ?? null,
      });
    } catch (logErr) {
      console.error(
        "[whatsapp] failed to log message:",
        logErr instanceof Error ? logErr.message : logErr,
      );
    }
  }

  return status === "sent"
    ? { ok: true, sid: twilio_sid }
    : { ok: false, error: errorMsg };
}

export async function sendAdminAlert(body: string): Promise<boolean> {
  const admin = process.env.ADMIN_WHATSAPP;
  if (!admin) {
    console.warn("[whatsapp] ADMIN_WHATSAPP not set — skipping admin alert");
    return false;
  }
  const result = await sendWhatsApp(admin, `[Milano Seal] ${body}`);
  return result.ok;
}
