"use client";

import { useState, useCallback } from "react";
import { Shield, Circle } from "lucide-react";
import { ContextStream, type ContextItem } from "@/components/va/ContextStream";
import { CommandTerminal } from "@/components/va/CommandTerminal";
import { VAActionRail } from "@/components/va/VAActionRail";
import { VAMatterCard } from "@/components/va/VAMatterCard";
import { VAPermissionNotice } from "@/components/va/VAPermissionNotice";
import { parseVACommand, executeVACommandPreview } from "@/lib/va/commands";

// ── Safe demo seed — no sensitive fields ──────────────────────────────────────

const DEMO_ITEMS: ContextItem[] = [
  {
    matter_id: "MS-2024-0041",
    client_name: "A. Carvalho",
    document_type: "Birth Certificate",
    destination_country: "Portugal",
    current_state: "apostille_processing",
    payment_status: "confirmed",
    payment_confirmed: true,
    packet_flags: [],
    courier_status: "not_shipped",
    tracking_number: null,
    next_safe_action: "Confirm apostille dispatch to FL Sec of State",
    risk_flag: null,
    assigned_operator: "N. Milano",
    updated_at: "2024-06-10T09:14:00Z",
  },
  {
    matter_id: "MS-2024-0044",
    client_name: "M. Diallo",
    document_type: "Corporate Resolution",
    destination_country: "Senegal",
    current_state: "under_review",
    payment_status: "confirmed",
    payment_confirmed: true,
    packet_flags: ["missing_notary_block", "missing_signature"],
    courier_status: "not_shipped",
    tracking_number: null,
    next_safe_action: "Request complete packet from client — notary block missing",
    risk_flag: "Packet incomplete — cannot advance to execution",
    assigned_operator: "N. Milano",
    updated_at: "2024-06-10T08:55:00Z",
  },
  {
    matter_id: "MS-2024-0038",
    client_name: "L. Ferreira",
    document_type: "Marriage Certificate",
    destination_country: "Brazil",
    current_state: "awaiting_payment",
    payment_status: "pending",
    payment_confirmed: false,
    packet_flags: [],
    courier_status: "not_shipped",
    tracking_number: null,
    next_safe_action: "Follow up with client on payment — invoice sent",
    risk_flag: null,
    assigned_operator: "N. Milano",
    updated_at: "2024-06-09T16:30:00Z",
  },
  {
    matter_id: "MS-2024-0039",
    client_name: "R. Okonkwo",
    document_type: "Power of Attorney",
    destination_country: "Nigeria",
    current_state: "in_transit",
    payment_status: "confirmed",
    payment_confirmed: true,
    packet_flags: [],
    courier_status: "in_transit",
    tracking_number: "DHL-9831220044",
    next_safe_action: "Monitor delivery — confirm receipt with client",
    risk_flag: null,
    assigned_operator: "N. Milano",
    updated_at: "2024-06-10T07:22:00Z",
  },
];

// ── Styles ─────────────────────────────────────────────────────────────────────

const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.08)";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function VAPortalPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [terminalInput, setTerminalInput] = useState<string | undefined>();

  const selectedItem = DEMO_ITEMS.find((i) => i.matter_id === selectedId) ?? null;

  const handleAction = useCallback((cmd: string) => {
    setTerminalInput(cmd);
    // Reset after short delay so CommandTerminal picks up new value even if same cmd repeated
    setTimeout(() => setTerminalInput(undefined), 100);
  }, []);

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "rgba(8,5,1,0.99)", color: "#e8e4dc", fontFamily: "monospace" }}
    >
      {/* Topbar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ background: "rgba(8,5,1,0.99)", borderBottom: `1px solid ${BORDER}` }}
      >
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-sm flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(212,175,55,0.1)" }}>
            <Shield size={14} style={{ color: "rgba(212,175,55,0.7)" }} />
          </div>
          <div>
            <div className="text-xs font-light tracking-widest"
              style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
              The Milano Seal™
            </div>
            <div className="text-[9px] font-mono tracking-[0.25em]" style={{ color: GOLD_DIM }}>
              EXECUTION SUPPORT PORTAL
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Circle size={6} fill="rgba(212,175,55,0.7)" style={{ color: "rgba(212,175,55,0.7)" }} />
          <span className="text-[9px] font-mono tracking-wider" style={{ color: "rgba(255,255,255,0.25)" }}>
            EXECUTION SUPPORT
          </span>
        </div>
      </header>

      {/* Page header */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 3 }}>
          FOURTH ACCESS LAYER · themilanoseal.com/va/portal
        </p>
        <h1 style={{ fontSize: "clamp(1rem,2.5vw,1.3rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8", marginBottom: 3 }}>
          Execution Support Portal
        </h1>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Matter support · client follow-up preparation · escalation · operator-controlled release
        </p>
      </div>

      <div className="px-5 pb-3 flex-shrink-0">
        <VAPermissionNotice />
      </div>

      {/* Main body */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 px-5 pb-4 min-h-0">
        {/* Left: Context Stream */}
        <div className="lg:w-[360px] flex-shrink-0 overflow-y-auto">
          <ContextStream
            items={DEMO_ITEMS}
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </div>

        {/* Center: Matter card + terminal */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {selectedItem && (
            <VAMatterCard item={selectedItem} />
          )}

          {/* Command Terminal fills remaining space */}
          <div className="flex-1 min-h-[280px]">
            <CommandTerminal selectedMatterId={terminalInput !== undefined ? null : selectedId} />
          </div>
        </div>
      </div>

      {/* Action Rail */}
      <div className="flex-shrink-0">
        <VAActionRail
          selectedMatterId={selectedId}
          onCommand={handleAction}
        />
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 px-5 py-2.5 flex items-center justify-between"
        style={{ borderTop: `1px solid rgba(255,255,255,0.04)` }}>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", letterSpacing: "0.12em" }}>
          RESTRICTED ACCESS · EXECUTION SUPPORT PORTAL · PAYMENT GATE ACTIVE
        </span>
        <span style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.15em" }}>
          THE MILANO SEAL™
        </span>
      </footer>
    </div>
  );
}
