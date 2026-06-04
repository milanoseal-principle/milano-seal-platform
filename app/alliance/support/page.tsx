"use client";

import { useState } from "react";
import { Send, CheckCircle, MessageSquare, Mail } from "lucide-react";

export default function AllianceSupportPage() {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Support messages route through the existing messages infrastructure
    await fetch("/api/alliance/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "support", ...form }),
    }).catch(() => null);
    setSubmitting(false);
    setSent(true);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(198,166,91,0.2)",
    borderRadius: 4,
    color: "#F6F1E6",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#F6F1E6" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.25em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            Alliance Support
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 300, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 12px" }}>
            Partner Support
          </h1>
          <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.6, margin: 0 }}>
            Contact the Milano Seal Alliance team for account questions, onboarding support, or referral inquiries.
          </p>
        </div>

        {/* Contact options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              padding: "20px",
              background: "#0d0d0d",
              border: "1px solid rgba(198,166,91,0.14)",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(198,166,91,0.08)", border: "1px solid rgba(198,166,91,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mail size={16} color="#C6A55A" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#F6F1E6", marginBottom: 4 }}>Email Support</div>
              <div style={{ fontSize: 12, color: "#A8A29A" }}>alliance@themilanoseal.com</div>
            </div>
          </div>
          <div
            style={{
              padding: "20px",
              background: "#0d0d0d",
              border: "1px solid rgba(198,166,91,0.14)",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(198,166,91,0.08)", border: "1px solid rgba(198,166,91,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageSquare size={16} color="#C6A55A" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#F6F1E6", marginBottom: 4 }}>Response Time</div>
              <div style={{ fontSize: 12, color: "#A8A29A" }}>1–2 business days</div>
            </div>
          </div>
        </div>

        {/* Message form */}
        <div
          style={{
            padding: "28px",
            background: "#0d0d0d",
            border: "1px solid rgba(198,166,91,0.14)",
            borderRadius: 8,
          }}
        >
          {sent ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(63,164,122,0.1)", border: "1px solid rgba(63,164,122,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckCircle size={22} color="#3FA47A" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "#F6F1E6", marginBottom: 8 }}>Message Sent</div>
              <p style={{ fontSize: 13, color: "#A8A29A", lineHeight: 1.6 }}>
                The Milano Seal Alliance team will respond within 1–2 business days.
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#F6F1E6", marginBottom: 20 }}>Send a Message</div>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 6 }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 6 }}>
                    Message
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 20px",
                    background: "rgba(198,166,91,0.1)",
                    border: "1px solid rgba(198,166,91,0.3)",
                    borderRadius: 4,
                    color: "#C6A55A",
                    fontSize: 12,
                    fontFamily: "monospace",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    alignSelf: "flex-start",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <Send size={13} />
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
