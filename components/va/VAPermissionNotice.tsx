"use client";

import { ShieldAlert } from "lucide-react";

export function VAPermissionNotice() {
  return (
    <div
      className="flex items-start gap-3 rounded-sm px-4 py-3"
      style={{
        background: "rgba(212,175,55,0.03)",
        border: "1px solid rgba(212,175,55,0.1)",
        fontFamily: "monospace",
      }}
    >
      <ShieldAlert size={13} style={{ color: "rgba(212,175,55,0.45)", flexShrink: 0, marginTop: 1 }} />
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.6, margin: 0 }}>
        Virtual Assistant access is limited to support preparation, matter review, client follow-up
        preparation, and escalation.{" "}
        <span style={{ color: "rgba(212,175,55,0.5)" }}>
          Payment confirmation, execution release, and final document release remain operator-controlled.
        </span>
      </p>
    </div>
  );
}
