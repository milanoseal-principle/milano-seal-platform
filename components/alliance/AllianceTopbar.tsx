"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";

interface AllianceTopbarProps {
  partnerName?: string;
  routingEligible?: boolean;
  firmName?: string;
}

export function AllianceTopbar({ partnerName, routingEligible, firmName }: AllianceTopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/alliance/login");
  }

  return (
    <header
      style={{
        height: 52,
        background: "#080808",
        borderBottom: "1px solid rgba(198,166,91,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {firmName && (
          <span style={{ fontSize: 13, color: "#F6F1E6", fontWeight: 500 }}>
            {firmName}
          </span>
        )}
        {partnerName && firmName && (
          <span style={{ fontSize: 11, color: "#A8A29A" }}>· {partnerName}</span>
        )}
        {partnerName && !firmName && (
          <span style={{ fontSize: 13, color: "#F6F1E6" }}>{partnerName}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Readiness badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            background: routingEligible ? "rgba(63,164,122,0.12)" : "rgba(184,92,92,0.12)",
            border: `1px solid ${routingEligible ? "rgba(63,164,122,0.3)" : "rgba(184,92,92,0.3)"}`,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: routingEligible ? "#3FA47A" : "#B85C5C",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: routingEligible ? "#3FA47A" : "#B85C5C",
              textTransform: "uppercase",
            }}
          >
            {routingEligible ? "Routing Active" : "Routing Locked"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            background: "transparent",
            border: "1px solid rgba(198,166,91,0.2)",
            borderRadius: 6,
            color: "#A8A29A",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </header>
  );
}
