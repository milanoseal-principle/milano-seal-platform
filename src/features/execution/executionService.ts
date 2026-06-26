import { createSession } from "./blueNotaryAdapter";
import { assertSchedulingAllowed } from "@/src/features/payments/paymentGateService";
import { getMatterById, updateMatter } from "@/src/features/matters/matterRepository";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";

export async function scheduleRonExecution(matterId: string, actorEmail?: string | null) {
  const matterResult = await getMatterById(matterId);
  if (matterResult.error) throw matterResult.error;
  assertSchedulingAllowed(matterResult.data);
  const session = await createSession({ matterId });
  await updateMatter(matterId, { status: "scheduled" });
  await writeEventLedger({ matterId, actorEmail, eventType: "EXECUTION_SCHEDULED", statusAfter: "scheduled", metadata: { session } });
  return session;
}

export async function markRonCompleted(matterId: string, actorEmail?: string | null) {
  const updated = await updateMatter(matterId, { status: "ron_completed" });
  if (updated.error) throw updated.error;
  await writeEventLedger({ matterId, actorEmail, eventType: "RON_COMPLETED", statusAfter: "ron_completed" });
  await writeEventLedger({ matterId, actorEmail, eventType: "EXECUTION_COMPLETED" });
  return updated.data;
}
