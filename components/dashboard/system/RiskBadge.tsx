import { AlertTriangle, ShieldAlert, Stamp, Lock, Clock, FileQuestion, UserX, PackageX, Scale } from "lucide-react";
import { toneStyles, type DashboardTone } from "./dashboardTheme";

// Operator risk / attention badges. Calm, restrained — surfaces a real condition,
// never decorative. Each kind maps to a tone + icon + concise label.

export type RiskKind =
  | "ron_risk"
  | "receiving_authority_review"
  | "apostille_required"
  | "payment_mismatch"
  | "release_locked"
  | "overdue_follow_up"
  | "compliance_manual_review"
  | "courier_exception"
  | "missing_document"
  | "missing_signer_data";

const MAP: Record<RiskKind, { label: string; tone: DashboardTone; Icon: typeof AlertTriangle }> = {
  ron_risk: { label: "RON Risk", tone: "amber", Icon: ShieldAlert },
  receiving_authority_review: { label: "Receiving-Authority Review", tone: "blue", Icon: Scale },
  apostille_required: { label: "Apostille Required", tone: "gold", Icon: Stamp },
  payment_mismatch: { label: "Payment Mismatch", tone: "red", Icon: AlertTriangle },
  release_locked: { label: "Release Locked", tone: "red", Icon: Lock },
  overdue_follow_up: { label: "Overdue Follow-Up", tone: "amber", Icon: Clock },
  compliance_manual_review: { label: "Manual Review", tone: "amber", Icon: ShieldAlert },
  courier_exception: { label: "Courier Exception", tone: "red", Icon: PackageX },
  missing_document: { label: "Missing Document", tone: "amber", Icon: FileQuestion },
  missing_signer_data: { label: "Missing Signer Data", tone: "amber", Icon: UserX },
};

export function RiskBadge({ kind, label }: { kind: RiskKind; label?: string }) {
  const m = MAP[kind];
  const t = toneStyles[m.tone];
  const Icon = m.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium"
      style={{ color: t.fg, background: t.bg, border: `1px solid ${t.border}` }}
    >
      <Icon className="h-3 w-3" />
      {label ?? m.label}
    </span>
  );
}
