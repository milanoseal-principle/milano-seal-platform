"use client";

import { AlertTriangle, MessageSquare, Package, GitMerge, Copy, CheckSquare, ArrowUpCircle } from "lucide-react";

interface VAActionRailProps {
  selectedMatterId: string | null;
  onCommand: (cmd: string) => void;
}

interface Action {
  label: string;
  icon: React.ElementType;
  command: (id: string) => string;
  requiresSelection: boolean;
  color?: string;
}

const ACTIONS: Action[] = [
  {
    label: "Request Operator Review",
    icon: ArrowUpCircle,
    command: (id) => `request operator review ${id}`,
    requiresSelection: true,
    color: "rgba(239,68,68,0.7)",
  },
  {
    label: "Prepare Client Follow-Up",
    icon: MessageSquare,
    command: (id) => `prepare followup ${id}`,
    requiresSelection: true,
  },
  {
    label: "View Packet Flags",
    icon: Package,
    command: (id) => `view packet flags ${id}`,
    requiresSelection: true,
  },
  {
    label: "View Reconciliation",
    icon: GitMerge,
    command: (id) => `view next action ${id}`,
    requiresSelection: true,
  },
  {
    label: "Copy Wise Reference",
    icon: Copy,
    command: (id) => `copy wise reference ${id}`,
    requiresSelection: true,
  },
  {
    label: "Copy Tracking Number",
    icon: Copy,
    command: (id) => `copy tracking number ${id}`,
    requiresSelection: true,
  },
  {
    label: "Mark Follow-Up Prepared",
    icon: CheckSquare,
    command: (id) => `mark client contacted ${id}`,
    requiresSelection: true,
  },
  {
    label: "Flag Needs Review",
    icon: AlertTriangle,
    command: (id) => `flag matter ${id} needs-review`,
    requiresSelection: true,
    color: "rgba(245,158,11,0.7)",
  },
];

const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.1)";

export function VAActionRail({ selectedMatterId, onCommand }: VAActionRailProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-3"
      style={{ borderTop: `1px solid ${BORDER}`, background: "rgba(8,5,1,0.98)" }}
    >
      <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.2em", fontFamily: "monospace", marginRight: 4 }}>
        QUICK ACTIONS
      </span>
      {ACTIONS.map((action) => {
        const disabled = action.requiresSelection && !selectedMatterId;
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            disabled={disabled}
            onClick={() => {
              if (!disabled && selectedMatterId) {
                onCommand(action.command(selectedMatterId));
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-colors text-[9px]"
            style={{
              border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : BORDER}`,
              color: disabled ? "rgba(255,255,255,0.15)" : (action.color ?? GOLD_DIM),
              background: "transparent",
              fontFamily: "monospace",
              letterSpacing: "0.1em",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Icon size={10} />
            {action.label.toUpperCase()}
          </button>
        );
      })}
      {!selectedMatterId && (
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", marginLeft: 4, fontFamily: "monospace" }}>
          SELECT A MATTER TO ENABLE ACTIONS
        </span>
      )}
    </div>
  );
}
