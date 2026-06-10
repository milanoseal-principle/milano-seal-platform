// VA Command Parser and Permission Enforcer
// VA can: read, flag, note, prepare, escalate, copy safe references
// VA cannot: confirm payment, release documents, change final state

export type CanonicalEvent =
  | "SMART_REQUEST_PARSED"
  | "STRUCTURED_INTAKE_CREATED"
  | "MATTER_CREATED"
  | "COMPLIANCE_VERIFIED"
  | "LANE_ASSIGNED"
  | "INVOICE_CREATED"
  | "INVOICE_SENT"
  | "PAYMENT_LINK_CREATED"
  | "PAYMENT_CONFIRMED"
  | "SCHEDULING_UNLOCKED"
  | "EXECUTION_SCHEDULED"
  | "RON_COMPLETED"
  | "APOSTILLE_SUBMITTED"
  | "APOSTILLE_COMPLETED"
  | "COURIER_RELEASED"
  | "DELIVERY_CONFIRMED"
  | "PAID_AND_RELEASED";

export interface VACommandResult {
  ok: boolean;
  code: string;
  message: string;
  matter_id?: string;
  event_name?: CanonicalEvent;
  requires_operator?: boolean;
  preview?: string;
}

// Commands that are always blocked for VA
const BLOCKED_PATTERNS = [
  /^confirm.?payment/i,
  /^release.?document/i,
  /^mark.?completed?/i,
  /^override/i,
  /^delete/i,
  /^change.?(client|payment|email|status|release)/i,
  /^payment.?confirm/i,
  /^set.?payment/i,
  /^approve.?release/i,
  /^final.?release/i,
];

export type VACommand =
  | { type: "help" }
  | { type: "search"; matter_id: string }
  | { type: "flag"; matter_id: string; reason: string }
  | { type: "add_note"; matter_id: string; note: string }
  | { type: "prepare_followup"; matter_id: string }
  | { type: "mark_contacted"; matter_id: string }
  | { type: "request_review"; matter_id: string }
  | { type: "copy_wise_ref"; matter_id: string }
  | { type: "copy_tracking"; matter_id: string }
  | { type: "view_packet_flags"; matter_id: string }
  | { type: "view_next_action"; matter_id: string }
  | { type: "blocked"; raw: string }
  | { type: "unknown"; raw: string };

export function parseVACommand(input: string): VACommand {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // Check blocked first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(lower)) return { type: "blocked", raw: trimmed };
  }

  if (lower === "help") return { type: "help" };

  const searchMatch = lower.match(/^search\s+matter\s+(\S+)/);
  if (searchMatch) return { type: "search", matter_id: searchMatch[1].toUpperCase() };

  const flagMatch = trimmed.match(/^flag\s+matter\s+(\S+)\s+(.+)/i);
  if (flagMatch) return { type: "flag", matter_id: flagMatch[1].toUpperCase(), reason: flagMatch[2] };

  const noteMatch = trimmed.match(/^add\s+note\s+(\S+)\s+(.+)/i);
  if (noteMatch) return { type: "add_note", matter_id: noteMatch[1].toUpperCase(), note: noteMatch[2] };

  const followupMatch = lower.match(/^prepare\s+followup\s+(\S+)/);
  if (followupMatch) return { type: "prepare_followup", matter_id: followupMatch[1].toUpperCase() };

  const contactedMatch = lower.match(/^mark\s+client\s+contacted\s+(\S+)/);
  if (contactedMatch) return { type: "mark_contacted", matter_id: contactedMatch[1].toUpperCase() };

  const reviewMatch = lower.match(/^request\s+operator\s+review\s+(\S+)/);
  if (reviewMatch) return { type: "request_review", matter_id: reviewMatch[1].toUpperCase() };

  const wiseMatch = lower.match(/^copy\s+wise\s+(?:reference|ref)\s+(\S+)/);
  if (wiseMatch) return { type: "copy_wise_ref", matter_id: wiseMatch[1].toUpperCase() };

  const trackMatch = lower.match(/^copy\s+tracking\s+(?:number\s+)?(\S+)/);
  if (trackMatch) return { type: "copy_tracking", matter_id: trackMatch[1].toUpperCase() };

  const packetMatch = lower.match(/^view\s+packet\s+flags?\s+(\S+)/);
  if (packetMatch) return { type: "view_packet_flags", matter_id: packetMatch[1].toUpperCase() };

  const nextMatch = lower.match(/^view\s+next\s+action\s+(\S+)/);
  if (nextMatch) return { type: "view_next_action", matter_id: nextMatch[1].toUpperCase() };

  return { type: "unknown", raw: trimmed };
}

export function executeVACommandPreview(command: VACommand): VACommandResult {
  switch (command.type) {
    case "help":
      return {
        ok: true,
        code: "HELP",
        message: [
          "AVAILABLE COMMANDS",
          "──────────────────────────────────",
          "search matter <MATTER-ID>",
          "flag matter <MATTER-ID> <reason>",
          "add note <MATTER-ID> <note>",
          "prepare followup <MATTER-ID>",
          "mark client contacted <MATTER-ID>",
          "request operator review <MATTER-ID>",
          "copy wise reference <MATTER-ID>",
          "copy tracking number <MATTER-ID>",
          "view packet flags <MATTER-ID>",
          "view next action <MATTER-ID>",
          "",
          "VA RESTRICTIONS ACTIVE",
          "Payment confirmation, document release,",
          "and final state changes require operator.",
        ].join("\n"),
      };

    case "blocked":
      return {
        ok: false,
        code: "VA_PERMISSION_DENIED",
        message:
          "PAYMENT_GATE_VIOLATION\n\nThis action requires operator authorization.\nVA cannot confirm payment, release documents, or override execution gates.",
        requires_operator: true,
      };

    case "unknown":
      return {
        ok: false,
        code: "UNKNOWN_COMMAND",
        message: `Unrecognized command: "${command.raw}"\nType "help" for available commands.`,
      };

    case "search":
      return {
        ok: true,
        code: "MATTER_SEARCH",
        matter_id: command.matter_id,
        message: `Searching for matter: ${command.matter_id}\nResults will appear in Context Stream.`,
      };

    case "flag":
      return {
        ok: true,
        code: "MATTER_FLAGGED",
        matter_id: command.matter_id,
        event_name: "COMPLIANCE_VERIFIED",
        requires_operator: true,
        message: `Matter ${command.matter_id} flagged: "${command.reason}"\nLedger event prepared. Operator approval required.`,
        preview: `NEEDS_REVIEW · ${command.matter_id} · ${command.reason}`,
      };

    case "add_note":
      return {
        ok: true,
        code: "NOTE_PREPARED",
        matter_id: command.matter_id,
        requires_operator: false,
        message: `Support note prepared for ${command.matter_id}:\n"${command.note}"\nNote is in preview — submit for operator to attach.`,
        preview: `NOTE · ${command.matter_id} · ${command.note}`,
      };

    case "prepare_followup":
      return {
        ok: true,
        code: "FOLLOWUP_PREPARED",
        matter_id: command.matter_id,
        message: `Client follow-up prepared for ${command.matter_id}.\nReview in Action Rail before sending.`,
      };

    case "mark_contacted":
      return {
        ok: true,
        code: "CLIENT_CONTACTED",
        matter_id: command.matter_id,
        event_name: "STRUCTURED_INTAKE_CREATED",
        message: `Marked client as contacted for ${command.matter_id}.\nActivity note queued for operator review.`,
        requires_operator: true,
      };

    case "request_review":
      return {
        ok: true,
        code: "OPERATOR_REVIEW_REQUESTED",
        matter_id: command.matter_id,
        event_name: "COMPLIANCE_VERIFIED",
        requires_operator: true,
        message: `Operator review requested for ${command.matter_id}.\nEscalation queued. Operator will be notified.`,
        preview: `ESCALATE · ${command.matter_id} · Operator review requested`,
      };

    case "copy_wise_ref":
      return {
        ok: true,
        code: "WISE_REF_COPIED",
        matter_id: command.matter_id,
        message: `Wise reference for ${command.matter_id} ready to copy.\n(Reference displayed in Context Stream — safe read-only)`,
      };

    case "copy_tracking":
      return {
        ok: true,
        code: "TRACKING_COPIED",
        matter_id: command.matter_id,
        message: `Tracking number for ${command.matter_id} ready to copy.\n(Carrier tracking displayed — safe read-only)`,
      };

    case "view_packet_flags":
      return {
        ok: true,
        code: "PACKET_FLAGS",
        matter_id: command.matter_id,
        message: `Packet QA flags for ${command.matter_id} loaded.\nReview flagged items in Context Stream.`,
      };

    case "view_next_action":
      return {
        ok: true,
        code: "NEXT_ACTION",
        matter_id: command.matter_id,
        message: `Next safe action for ${command.matter_id} displayed in Context Stream.`,
      };
  }
}
