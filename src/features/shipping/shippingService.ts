import { assertReleaseAllowed } from "@/src/features/payments/paymentGateService";
import { getMatterById, updateMatter } from "@/src/features/matters/matterRepository";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";

export const approvedCouriers = ["DHL Express", "FedEx International Priority", "UPS Worldwide Express", "Other"] as const;

export const finalPacketChecklist = [
  "Apostilled notarized document present",
  "Final invoice present",
  "Paid & Released Certificate present",
  "Thank-you slip included",
  "Optional business card included",
  "Gold slip or branded folder included",
  "Protective document sleeve included",
  "Courier envelope ready",
  "Tracking label printed",
  "Destination address verified",
  "Final payment confirmed",
  "Release unlocked",
] as const;

export async function addShipmentTracking(matterId: string, tracking: { courier: string; tracking_number: string; tracking_url?: string }, actorEmail?: string | null) {
  const matterResult = await getMatterById(matterId);
  if (matterResult.error) throw matterResult.error;
  assertReleaseAllowed(matterResult.data);
  await writeEventLedger({ matterId, actorEmail, eventType: "TRACKING_ADDED", metadata: tracking });
  return tracking;
}

export async function markShipped(matterId: string, actorEmail?: string | null) {
  const matterResult = await getMatterById(matterId);
  if (matterResult.error) throw matterResult.error;
  assertReleaseAllowed(matterResult.data);
  const updated = await updateMatter(matterId, { status: "shipped", release_status: "released" });
  if (updated.error) throw updated.error;
  await writeEventLedger({ matterId, actorEmail, eventType: "SHIPPED", statusAfter: "shipped" });
  return updated.data;
}
