export interface RelationshipEvent {
  id: string;
  agencyId: string;
  date: string;
  type: "Call" | "Email" | "Meeting" | "Event" | "Procurement Conference" | "Capability Statement" | "Introduction" | "Referral" | "Follow Up";
  summary: string;
  outcome: string;
  nextContact?: string;
  attachments: string[];
}

export function relationshipTrend(events: RelationshipEvent[]): "No history" | "Cooling" | "Stable" | "Warming" {
  if (events.length === 0) return "No history";
  const recent = events.filter((event) => Date.parse(event.date) > Date.now() - 1000 * 60 * 60 * 24 * 45);
  if (recent.length >= 2) return "Warming";
  if (recent.length === 1) return "Stable";
  return "Cooling";
}
