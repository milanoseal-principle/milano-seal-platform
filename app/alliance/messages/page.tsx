"use client";

import { useState, useEffect, useCallback } from "react";
import { AlliancePartnerMessages } from "@/components/alliance/AlliancePartnerMessages";

type Message = {
  id: string;
  from: "partner" | "milano_seal";
  content: string;
  created_at: string;
  read?: boolean;
};

export default function AllianceMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/alliance/messages");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      setError("Could not load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function handleSend(content: string) {
    const res = await fetch("/api/alliance/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Send failed");
    // Reload messages to get the new one with server-assigned id/timestamp
    await loadMessages();
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "#080808", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.3em]"
            style={{ color: "rgba(198,165,90,0.55)" }}
          >
            Alliance Partner Portal
          </p>
          <h1
            className="text-3xl font-light"
            style={{
              fontFamily: "var(--font-playfair),Georgia,serif",
              color: "#C6A55A",
            }}
          >
            Partner Messages
          </h1>
        </div>

        {error && (
          <div
            className="rounded-sm px-4 py-3 text-sm"
            style={{
              background: "rgba(180,50,50,0.08)",
              border: "1px solid rgba(180,50,50,0.2)",
              color: "rgba(255,100,100,0.8)",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Loading messages…
            </p>
          </div>
        ) : (
          <AlliancePartnerMessages messages={messages} onSend={handleSend} />
        )}
      </div>
    </div>
  );
}
