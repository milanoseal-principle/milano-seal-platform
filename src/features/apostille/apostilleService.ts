import { updateMatter } from "@/src/features/matters/matterRepository";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";

export const apostilleChecklist = [
  "Destination country confirmed",
  "Origin state confirmed",
  "Notarization verified",
  "Apostille cover letter included",
  "State request form included",
  "Return label included",
  "Internal matter reference included",
] as const;

export async function markApostilleSubmitted(matterId: string, actorEmail?: string | null) {
  const updated = await updateMatter(matterId, { status: "apostille_processing" });
  if (updated.error) throw updated.error;
  await writeEventLedger({ matterId, actorEmail, eventType: "APOSTILLE_SUBMITTED", statusAfter: "apostille_processing" });
  return updated.data;
}

export async function markApostilleReceived(matterId: string, actorEmail?: string | null) {
  const updated = await updateMatter(matterId, { status: "final_payment_required" });
  if (updated.error) throw updated.error;
  await writeEventLedger({ matterId, actorEmail, eventType: "APOSTILLE_RECEIVED", statusAfter: "final_payment_required" });
  await writeEventLedger({ matterId, actorEmail, eventType: "FINAL_PAYMENT_REQUESTED" });
  return updated.data;
}
