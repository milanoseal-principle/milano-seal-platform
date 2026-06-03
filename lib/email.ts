import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}
const FROM =
  process.env.RESEND_FROM ?? "The Milano Seal™ <hello@themilanoseal.com>";
const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://themilanoseal.com";

function base(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>The Milano Seal™</title>
</head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Georgia',serif;color:#B0B0B0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0A;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111111;border:1px solid #2A2A2A;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 40px 24px;border-bottom:1px solid #1A1A1A;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#C6A55A;font-family:Arial,sans-serif;">The Milano Seal™</p>
          <p style="margin:0;font-size:11px;color:#6A6A6A;font-family:Arial,sans-serif;letter-spacing:0.1em;text-transform:uppercase;">Intl. Document Execution · Florida Notary #668288</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">${content}</td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid #1A1A1A;background:#0A0A0A;">
          <p style="margin:0 0 6px;font-size:11px;color:#6A6A6A;font-family:Arial,sans-serif;">Questions? Reply to this email or contact Nicholas directly.</p>
          <p style="margin:0;font-size:11px;color:#4A4A4A;font-family:Arial,sans-serif;">The Milano Seal™ · Milano Seal International, LLC · <a href="${SITE}" style="color:#C6A55A;text-decoration:none;">${SITE.replace("https://", "")}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function goldBtn(href: string, label: string): string {
  return `<a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;background:#C6A55A;color:#0A0A0A;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.05em;">${label}</a>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:26px;color:#FFFFFF;font-weight:400;line-height:1.3;">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#B0B0B0;font-family:Arial,sans-serif;">${text}</p>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:12px;color:#6A6A6A;font-family:Arial,sans-serif;border-bottom:1px solid #1A1A1A;width:40%;">${label}</td>
    <td style="padding:8px 0;font-size:12px;color:#FFFFFF;font-family:Arial,sans-serif;border-bottom:1px solid #1A1A1A;font-weight:600;">${value}</td>
  </tr>`;
}

// ── 1. INTAKE CONFIRMATION ─────────────────────────────────────────────────

export async function sendIntakeConfirmation({
  to,
  name,
  dealId,
  lane,
  total,
  retainer,
  paymentLink,
  portalUrl,
}: {
  to: string;
  name: string;
  dealId: string;
  lane: string;
  total: number;
  retainer: number;
  paymentLink: string;
  portalUrl: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const html = base(`
    ${h1("Your matter has been received.")}
    ${p(`Thank you, ${name}. Your request has been logged and Nicholas will review it within one business day. Your reference is below — keep it handy.`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
      ${infoRow("Reference", dealId)}
      ${infoRow("Execution Lane", lane)}
      ${infoRow("Total Investment", `$${Number(total).toLocaleString()} USD`)}
      ${infoRow("Retainer Due (50%)", `$${Number(retainer).toLocaleString()} USD`)}
    </table>

    ${p("To get started, pay your retainer securely via Wise. Once received, your matter moves to scheduling immediately.")}

    <div style="margin:0 0 28px;">
      ${goldBtn(paymentLink, "Pay Retainer — $" + Number(retainer).toLocaleString() + " USD")}
    </div>

    ${p(`You can track your matter progress and upload documents through your secure client portal:`)}

    <div style="margin:0 0 28px;">
      <a href="${portalUrl}" style="font-size:13px;color:#C6A55A;font-family:Arial,sans-serif;">${portalUrl}</a>
    </div>

    ${p("Wise is the primary payment method. A Stripe payment link may be provided upon request. Contact us directly for payment arrangements.")}
  `);

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Matter Received — ${dealId} · The Milano Seal™`,
    html,
  }).catch((err) => console.error("[email] intake confirmation failed:", err));
}

// ── 2. SCHEDULED ──────────────────────────────────────────────────────────

export async function sendScheduledNotification({
  to,
  name,
  dealId,
  scheduledAt,
  portalUrl,
}: {
  to: string;
  name: string;
  dealId: string;
  scheduledAt: string | null;
  portalUrl: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const dateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "To be confirmed";

  const html = base(`
    ${h1("Your appointment is scheduled.")}
    ${p(`${name}, your execution appointment has been confirmed. Please plan to have all required documents ready.`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
      ${infoRow("Reference", dealId)}
      ${infoRow("Scheduled For", dateStr)}
    </table>

    ${p("Nicholas will reach out closer to the date with final instructions. If you need to reschedule, reply to this email as soon as possible.")}

    <div style="margin:0 0 28px;">
      ${goldBtn(portalUrl, "View Matter Status")}
    </div>
  `);

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Appointment Confirmed — ${dealId} · The Milano Seal™`,
    html,
  }).catch((err) => console.error("[email] scheduled notification failed:", err));
}

// ── 3. SHIPPED ────────────────────────────────────────────────────────────

export async function sendShippedNotification({
  to,
  name,
  dealId,
  carrier,
  trackingNumber,
  balanceAmount,
  balanceLink,
  portalUrl,
}: {
  to: string;
  name: string;
  dealId: string;
  carrier: string | null;
  trackingNumber: string | null;
  balanceAmount: number | null;
  balanceLink: string | null;
  portalUrl: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const html = base(`
    ${h1("Your documents are on the way.")}
    ${p(`${name}, your executed documents have been shipped and are in transit to you.`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 28px;">
      ${infoRow("Reference", dealId)}
      ${carrier ? infoRow("Carrier", carrier) : ""}
      ${trackingNumber ? infoRow("Tracking Number", trackingNumber) : ""}
    </table>

    ${balanceAmount && balanceLink ? `
    <div style="background:#0A0A0A;border:1px solid #C6A55A33;border-radius:12px;padding:24px;margin:0 0 28px;">
      <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#C6A55A;font-family:Arial,sans-serif;">Balance Due</p>
      <p style="margin:0 0 16px;font-size:22px;color:#FFFFFF;font-family:Arial,sans-serif;font-weight:700;">$${Number(balanceAmount).toLocaleString()} USD</p>
      <p style="margin:0 0 16px;font-size:13px;color:#B0B0B0;font-family:Arial,sans-serif;line-height:1.6;">Your matter has shipped. Please settle the remaining balance at your earliest convenience.</p>
      ${goldBtn(balanceLink, "Pay Balance — $" + Number(balanceAmount).toLocaleString() + " USD")}
    </div>
    ` : ""}

    <div style="margin:0 0 28px;">
      ${goldBtn(portalUrl, "Track Your Matter")}
    </div>
  `);

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Documents Shipped — ${dealId} · The Milano Seal™`,
    html,
  }).catch((err) => console.error("[email] shipped notification failed:", err));
}

// ── 4. COMPLETED ──────────────────────────────────────────────────────────

export async function sendCompletedNotification({
  to,
  name,
  dealId,
  portalUrl,
}: {
  to: string;
  name: string;
  dealId: string;
  portalUrl: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const html = base(`
    ${h1("Your matter is complete.")}
    ${p(`${name}, your matter <strong style="color:#FFFFFF;">${dealId}</strong> has been fully executed and delivered. Thank you for trusting The Milano Seal™.`)}

    ${p("All documents have been executed, apostilled (where required), and delivered. Your matter is now closed.")}

    <div style="margin:0 0 28px;">
      ${goldBtn(portalUrl, "View Completed Matter")}
    </div>

    ${p("If you require additional document services in the future, we are here. Reply to this email or visit themilanoseal.com.")}
  `);

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Matter Complete — ${dealId} · The Milano Seal™`,
    html,
  }).catch((err) => console.error("[email] completed notification failed:", err));
}
