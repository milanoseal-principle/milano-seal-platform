import type { FollowUpCadence } from "./types";

export const followUpScripts: Record<FollowUpCadence, { title: string; script: string }> = {
  "24_hours": {
    title: "Gentle reminder",
    script: "Your secure intake is ready for review. Reply with any receiving-authority details so we can confirm the execution pathway before scheduling.",
  },
  "48_hours": {
    title: "Availability reminder",
    script: "We can keep the matter moving once payment authorization is complete. Scheduling remains locked until payment is confirmed.",
  },
  "72_hours": {
    title: "Founder review check",
    script: "If the matter is still active, Nicholas can review the pathway and timing before the quote is archived.",
  },
  "7_days": {
    title: "Stale quote archive",
    script: "This quote is aging into archive status unless you want us to refresh timing, destination, or execution requirements.",
  },
};

export const professionalFollowUpScripts = [
  "Attorney/professional matters should include client authority, destination country, document title, and deadline before founder review.",
  "International client matters should confirm signer location, receiving authority, apostille/authentication need, and translation requirements before quote refresh.",
];
