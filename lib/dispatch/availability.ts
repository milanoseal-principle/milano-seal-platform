// Availability model + helpers.
// Availability is a partner's self-declared openness to receive offers. Open
// slots are never a promise of work; booked slots are never a guarantee of pay.

import type { AvailabilitySlot } from "./types";

// Slots a partner has marked open or tentative.
export function openSlots(slots: AvailabilitySlot[]): AvailabilitySlot[] {
  return slots.filter((s) => s.state === "open" || s.state === "tentative");
}

// Does the partner have an open slot covering the requested time?
export function isAvailableAt(
  slots: AvailabilitySlot[],
  isoDateTime: string,
): boolean {
  const t = new Date(isoDateTime).getTime();
  return slots.some(
    (s) =>
      s.state === "open" &&
      new Date(s.start).getTime() <= t &&
      new Date(s.end).getTime() >= t,
  );
}

// Group slots by partner id.
export function slotsByPartner(
  slots: AvailabilitySlot[],
): Record<string, AvailabilitySlot[]> {
  const out: Record<string, AvailabilitySlot[]> = {};
  for (const s of slots) {
    (out[s.partnerId] ||= []).push(s);
  }
  return out;
}
