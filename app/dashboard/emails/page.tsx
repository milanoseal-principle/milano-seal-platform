"use client";

import { useState } from "react";

interface EmailTemplate {
  id: string;
  stage: string;
  subject: string;
  body: string;
  color: string;
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: "quote-d1",
    stage: "Quote Follow-up — Day 1",
    color: "#f59e0b",
    subject: "Following Up: Your Document Execution Quote — The Milano Seal™",
    body: `Hi [CLIENT_NAME],

Just wanted to follow up on the quote we sent over for your [DESTINATION] apostille matter.

Your total is [AMOUNT]. We're ready to move forward as soon as you give the green light — execution slots fill quickly.

Any questions? Reply here or call us directly.

Best,
The Milano Seal™`,
  },
  {
    id: "quote-d3",
    stage: "Quote Follow-up — Day 3",
    color: "#f59e0b",
    subject: "Still Interested? Your Quote is Ready — The Milano Seal™",
    body: `Hi [CLIENT_NAME],

We wanted to check in — your quote for [DESTINATION] document execution is still active at [AMOUNT].

If your timeline has changed or you have questions, we're happy to adjust.

Ready to proceed? Simply reply "Yes, proceed" and we'll send your payment link.

The Milano Seal™`,
  },
  {
    id: "quote-d7",
    stage: "Quote Follow-up — Day 7",
    color: "#f59e0b",
    subject: "Last Check-in: Your Document Matter — The Milano Seal™",
    body: `Hi [CLIENT_NAME],

This is our final follow-up on your [DESTINATION] apostille quote ([AMOUNT]).

If this is no longer needed, no worries — just let us know. If you're still interested, we can hold a spot for you this week.

We're here when you're ready.

— The Milano Seal™ Team`,
  },
  {
    id: "payment-confirmed",
    stage: "Payment Confirmed — Next Steps",
    color: "#4a9e6b",
    subject: "Payment Received — Here's What Happens Next | The Milano Seal™",
    body: `Dear [CLIENT_NAME],

We've received your payment of [AMOUNT]. Your matter is now active.

Here's what happens next:

1. Document Review — We'll review everything you've submitted within 1 business day.
2. Execution Scheduling — Your appointment will be confirmed shortly.
3. Processing — Documents are executed and submitted to the appropriate authority.
4. Release — Upon completion, you'll receive your finalized documents.

Reference: [MATTER_REF]
Destination: [DESTINATION]

We'll keep you updated at each stage.

The Milano Seal™`,
  },
  {
    id: "execution-scheduled",
    stage: "Execution Scheduled Confirmation",
    color: "#C6A55A",
    subject: "Your Execution Is Scheduled — The Milano Seal™",
    body: `Dear [CLIENT_NAME],

Your document execution has been scheduled.

Details:
• Document: [DOCUMENT_TYPE]
• Destination: [DESTINATION]
• Scheduled Date: [SCHEDULED_DATE]
• Matter Reference: [MATTER_REF]

Please ensure all documents are ready. We'll send a reminder closer to your appointment.

Questions? Reply to this email.

The Milano Seal™`,
  },
  {
    id: "doc-ready",
    stage: "Document Ready for Release",
    color: "#C6A55A",
    subject: "Your Documents Are Ready — The Milano Seal™",
    body: `Dear [CLIENT_NAME],

Your documents are fully executed and ready for release.

Matter: [MATTER_REF]
Destination: [DESTINATION]
Amount Collected: [AMOUNT]

Please confirm your preferred delivery method:
• [ ] Secure courier (additional fee may apply)
• [ ] In-person pickup
• [ ] Digital certified copy

Reply to this email with your preference and we'll arrange delivery.

The Milano Seal™`,
  },
  {
    id: "completion",
    stage: "Completion & Review Request",
    color: "#4a9e6b",
    subject: "Matter Complete — Thank You | The Milano Seal™",
    body: `Dear [CLIENT_NAME],

Your matter is complete. All documents have been delivered.

Matter Reference: [MATTER_REF]
Destination: [DESTINATION]

We'd greatly appreciate a brief review of your experience. Your feedback helps us serve clients better.

[REVIEW LINK]

Thank you for trusting The Milano Seal™ with your international document needs.

With respect,
The Milano Seal™`,
  },
];

function TemplateCard({ t }: { t: EmailTemplate }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`Subject: ${t.subject}\n\n${t.body}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? "1px solid rgba(212,175,55,0.08)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: t.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(198,165,90,0.5)",
            }}
          >
            {t.stage}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "20px" }}>
          <div
            style={{
              background: "rgba(198,165,90,0.04)",
              border: "1px solid rgba(198,165,90,0.08)",
              borderRadius: 4,
              padding: "8px 14px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(198,165,90,0.5)", display: "block", marginBottom: 3 }}>SUBJECT</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{t.subject}</span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                padding: "3px 10px",
                borderRadius: 4,
                border: `1px solid ${copied ? "#4a9e6b44" : "rgba(212,175,55,0.15)"}`,
                background: copied ? "rgba(74,158,107,0.08)" : "transparent",
                color: copied ? "#4a9e6b" : "rgba(198,165,90,0.6)",
                cursor: "pointer",
                flexShrink: 0,
                marginLeft: 12,
              }}
            >
              {copied ? "COPIED" : "COPY ALL"}
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: "monospace",
              fontSize: 12,
              color: "rgba(255,255,255,0.65)",
              whiteSpace: "pre-wrap",
              lineHeight: 1.75,
            }}
          >
            {t.body}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function EmailsPage() {
  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 9,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.5)",
            margin: "0 0 4px",
          }}
        >
          MILANO SEAL / EMAIL TEMPLATES
        </p>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            margin: "0 0 8px",
          }}
        >
          Stage-by-Stage Email Templates
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            margin: "0 0 32px",
          }}
        >
          Click any template to expand. Use [PLACEHOLDERS] when sending.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
