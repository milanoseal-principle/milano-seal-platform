"use client";

import { useState } from "react";

const SCRIPTS = [
  {
    channel: "Phone Inquiry",
    id: "phone",
    color: "#C6A55A",
    template: `"Thank you for calling The Milano Seal. This is [YOUR NAME]. How can I assist you today?

I understand you're looking for [DOCUMENT TYPE / APOSTILLE / NOTARY] services. We specialize in international document execution for destinations including [MENTION THEIR COUNTRY IF KNOWN].

Let me ask a few quick questions so I can give you an accurate quote and timeline:
1. What document needs to be executed?
2. Which country is it going to?
3. What is your timeline?

Based on that, I can put together a custom execution plan for you. Shall we get started?"`,
  },
  {
    channel: "Email Inquiry",
    id: "email",
    color: "#4a9e6b",
    template: `Subject: Re: Your Document Execution Inquiry — The Milano Seal™

Dear [CLIENT NAME],

Thank you for reaching out to The Milano Seal™. We've reviewed your inquiry and are ready to assist with your international document execution needs.

Based on your request, here is what we recommend:

Document: [DOCUMENT TYPE]
Destination: [COUNTRY]
Estimated Timeline: [TIMELINE]
Execution Lane: [STANDARD / EXPEDITED / URGENT]

To proceed, please reply with:
• Confirmation of the above details
• Any additional documents required
• Your preferred contact method

We'll follow up within [TIMEFRAME] with a formal quote.

Warm regards,
The Milano Seal™ Execution Team`,
  },
  {
    channel: "Text / SMS Inquiry",
    id: "sms",
    color: "#f59e0b",
    template: `Hi [NAME], this is The Milano Seal™. Thanks for reaching out!

To give you an accurate quote, I need:
1. Document type?
2. Destination country?
3. Your timeline?

Reply anytime — we respond fast. 🔏`,
  },
  {
    channel: "Referral Partner Inquiry",
    id: "referral",
    color: "#a78bfa",
    template: `Hello [ATTORNEY / PARTNER NAME],

Thank you for the referral. We've received your client's information and will be in touch with them shortly.

For your records:
• Client Name: [CLIENT NAME]
• Document: [DOCUMENT TYPE]
• Destination: [COUNTRY]
• Matter Reference: [REF #]

We'll keep you updated at key milestones. As always, your clients are in expert hands.

Best,
The Milano Seal™ Execution Team`,
  },
];

function ScriptCard({ script }: { script: typeof SCRIPTS[0] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(script.template).then(() => {
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
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid rgba(212,175,55,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: script.color,
              display: "inline-block",
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
            {script.channel}
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            padding: "4px 12px",
            borderRadius: 4,
            border: `1px solid ${copied ? "#4a9e6b44" : "rgba(212,175,55,0.15)"}`,
            background: copied ? "rgba(74,158,107,0.08)" : "transparent",
            color: copied ? "#4a9e6b" : "rgba(198,165,90,0.6)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: "20px",
          fontFamily: "monospace",
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
        }}
      >
        {script.template}
      </pre>
    </div>
  );
}

export default function ScriptsPage() {
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
          MILANO SEAL / RESPONSE SCRIPTS
        </p>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "rgba(255,255,255,0.92)",
            margin: "0 0 8px",
          }}
        >
          Inbound Response Scripts
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 13,
            margin: "0 0 32px",
          }}
        >
          Channel-specific templates for first contact. Click COPY to copy any script.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {SCRIPTS.map((s) => (
            <ScriptCard key={s.id} script={s} />
          ))}
        </div>
      </div>
    </div>
  );
}
