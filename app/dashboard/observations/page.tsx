"use client";
import { useState } from 'react';

import { motion } from "framer-motion";
import { Eye, Copy, Check, Mail, Linkedin, MessageCircle } from "lucide-react";

const GOLD = "#C6A55A";
const EASE = [0.22, 1, 0.36, 1] as const;

interface Template {
  id: string;
  title: string;
  category: string;
  fields: string[];
  body: string;
}

const TEMPLATES: Template[] = [
  {
    id: "hours",
    title: "Verify Authority Hours / Schedule",
    category: "Schedule Intelligence",
    fields: ["AUTHORITY NAME", "CITY, COUNTRY", "DOCUMENT TYPE"],
    body: `We are coordinating a document submission to [AUTHORITY NAME] in [CITY, COUNTRY] and would appreciate your observations on current processing schedules. Specifically: current walk-in hours, appointment availability, and average processing time for [DOCUMENT TYPE] apostille. Any observations you can share would help us better serve mutual clients.`,
  },
  {
    id: "timeline",
    title: "Verify Processing Timeline",
    category: "Timeline Intelligence",
    fields: ["AUTHORITY NAME", "DOCUMENT TYPE", "URGENCY"],
    body: `Could you share any recent observations on the current apostille processing time at [AUTHORITY NAME]? We are coordinating a [DOCUMENT TYPE] matter for a client with a [URGENCY] timeline and want to set accurate expectations.`,
  },
  {
    id: "requirements",
    title: "Verify Current Requirements",
    category: "Requirements Intelligence",
    fields: ["AUTHORITY NAME", "DOCUMENT TYPE"],
    body: `We want to confirm the current submission requirements at [AUTHORITY NAME] for [DOCUMENT TYPE]. Specifically: are there any recent changes to notarization requirements, acceptable notary formats, or document age restrictions we should know about?`,
  },
  {
    id: "partner",
    title: "Partner Observation Request",
    category: "Partner Intelligence",
    fields: ["COUNTRY", "AUTHORITY NAME"],
    body: `As a partner in [COUNTRY], we would appreciate your professional observations on [AUTHORITY NAME]. Any intelligence you can share regarding their current acceptance criteria, rejection patterns, or processing efficiency would be valuable to our authority intelligence network.`,
  },
  {
    id: "courier",
    title: "Courier Delivery Observation",
    category: "Courier Intelligence",
    fields: ["AUTHORITY NAME", "CITY"],
    body: `We are routing a delivery to [AUTHORITY NAME] in [CITY]. Could you confirm: current delivery acceptance procedures, preferred delivery window, any known issues with receiving documents at this location, and contact person if available?`,
  },
  {
    id: "change-alert",
    title: "Authority Change Alert",
    category: "Change Intelligence",
    fields: ["AUTHORITY NAME", "REQUIREMENT TYPE"],
    body: `We have received information suggesting [AUTHORITY NAME] may have changed their [REQUIREMENT TYPE]. Can you confirm or deny this change from your direct experience? This helps us maintain accurate routing intelligence.`,
  },
];

function highlight(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (/^\[.+\]$/.test(part)) {
      return (
        <mark
          key={i}
          style={{
            background: "rgba(198,165,90,0.18)",
            color: GOLD,
            borderRadius: 2,
            padding: "0 2px",
            fontWeight: 600,
          }}
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export default function ObservationsPage() {
  const [selected, setSelected] = useState<string>(TEMPLATES[0].id);
  const [copied, setCopied] = useState(false);

  const template = TEMPLATES.find((t) => t.id === selected) ?? TEMPLATES[0];

  function handleCopy() {
    navigator.clipboard.writeText(template.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      style={{ background: "#0A0A0A", minHeight: "100vh", padding: "32px 24px" }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", marginBottom: 8 }}>
          Intelligence · Authority Moat
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <Eye size={20} color={GOLD} />
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#fff", margin: 0 }}>Authority Observation Requests</h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, maxWidth: 560 }}>
          Structured observation request templates for partners, law firms, couriers, and local contacts. Responses are logged in the Institutional Memory Engine.
        </p>
      </div>

      {/* Operator note */}
      <div style={{
        background: "rgba(198,165,90,0.06)",
        border: "1px solid rgba(198,165,90,0.15)",
        borderRadius: 6,
        padding: "10px 16px",
        marginBottom: 28,
        fontSize: 12,
        color: "rgba(198,165,90,0.7)",
        fontFamily: "monospace",
      }}>
        ↯ Observation requests are sent manually. Responses are logged in the Institutional Memory Engine.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
        {/* Template selector */}
        <div>
          <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", marginBottom: 12 }}>
            Select Template
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TEMPLATES.map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.28, ease: EASE }}
                onClick={() => setSelected(t.id)}
                style={{
                  background: selected === t.id ? "rgba(198,165,90,0.1)" : "rgba(8,5,1,0.97)",
                  border: `1px solid ${selected === t.id ? "rgba(198,165,90,0.25)" : "rgba(212,175,55,0.08)"}`,
                  borderRadius: 6,
                  padding: "12px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: selected === t.id ? GOLD : "rgba(255,255,255,0.7)", marginBottom: 3 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>
                  {t.category}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Template preview */}
        <div>
          <motion.div
            key={template.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}
          >
            {/* Template header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{template.title}</div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {template.category}
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "8px 14px",
                    borderRadius: 4,
                    border: `1px solid rgba(198,165,90,0.2)`,
                    background: "transparent",
                    color: GOLD,
                    cursor: "pointer",
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* Fields */}
            <div style={{ padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)" }}>
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 8 }}>
                Fill in placeholders
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {template.fields.map((f) => (
                  <span key={f} style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    padding: "3px 10px",
                    borderRadius: 3,
                    background: "rgba(198,165,90,0.1)",
                    color: GOLD,
                    border: "1px solid rgba(198,165,90,0.2)",
                  }}>
                    [{f}]
                  </span>
                ))}
              </div>
            </div>

            {/* Template body */}
            <div style={{ padding: "20px 24px" }}>
              <p style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.7,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}>
                {highlight(template.body)}
              </p>
            </div>

            {/* Send via */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                Send via:
              </span>
              {[
                { label: "Email", Icon: Mail },
                { label: "LinkedIn", Icon: Linkedin },
                { label: "WhatsApp", Icon: MessageCircle },
              ].map(({ label, Icon }) => (
                <div
                  key={label}
                  style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.35)", fontSize: 12 }}
                >
                  <Icon size={13} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
