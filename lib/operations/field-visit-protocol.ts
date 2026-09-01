export type FieldVisitProtocolStep = {
  id: string;
  phase: "pre_visit" | "visit" | "no_response" | "second_visit" | "completion";
  title: string;
  instruction: string;
  evidence?: string;
  hardStop?: boolean;
};

export const FIELD_VISIT_PROTOCOL_SOURCE = {
  sourceFile: "Abujhaisha _ Snapdocs(1).pdf",
  sourceType: "third-party order instructions",
  sourceDate: "2026-07-29",
  scope: "Unannounced residential field visit for supplied affidavit execution",
  handling: "Internal operator reference only. Matter-specific instructions control.",
} as const;

export const FIELD_VISIT_PROTOCOL: FieldVisitProtocolStep[] = [
  {
    id: "preflight-legibility",
    phase: "pre_visit",
    title: "Review supplied packet before travel",
    instruction:
      "Confirm the supplied forms are legible, identify the requested signing task, and verify the Matter packet contains the contact-request material and any return instructions.",
    evidence: "Record packet review in the existing Matter activity/evidence system.",
  },
  {
    id: "preflight-notarial-act",
    phase: "pre_visit",
    title: "Resolve the notarial act before execution",
    instruction:
      "Use the document's supplied notarial certificate and Matter execution truth. Never infer jurat, acknowledgment, or another act from the document title.",
    hardStop: true,
  },
  {
    id: "visit-attempt",
    phase: "visit",
    title: "Make the authorized residential visit",
    instruction:
      "Attend the authorized address and time window, preserve professional conduct, and record the visit outcome without representing The Milano Seal as law enforcement, a law firm, or a court authority.",
    evidence: "Capture visit timestamp and outcome in the Matter record.",
  },
  {
    id: "signing-path",
    phase: "visit",
    title: "If contact is made, follow the governed signing path",
    instruction:
      "Proceed only when identity, signer willingness, document readiness, and the confirmed notarial act satisfy the existing Milano execution controls. Do not alter the supplied legal document or advise the signer on its legal effect.",
    hardStop: true,
  },
  {
    id: "no-response-letter",
    phase: "no_response",
    title: "If there is no response, leave only the authorized contact request",
    instruction:
      "Place the supplied contact-request letter in a sealed envelope at the residence using a non-damaging placement method where permitted. Do not leave the affidavit or other originals unsecured.",
    evidence: "Record that the contact-request letter was left and how it was placed.",
  },
  {
    id: "no-response-photo",
    phase: "no_response",
    title: "Capture residence evidence before departure",
    instruction:
      "When the source order requires it, take a photograph of the residence before departure and preserve it as Matter evidence. Avoid photographing people or unrelated private activity unless necessary for the authorized assignment.",
    evidence: "Attach residence photo to the Matter evidence record.",
  },
  {
    id: "second-visit-authorization",
    phase: "second_visit",
    title: "Second visit requires explicit authorization",
    instruction:
      "A second residential visit is a separate execution attempt. Perform it only when the order or operator instructions explicitly authorize the return visit and its timing.",
    hardStop: true,
  },
  {
    id: "second-visit-fee",
    phase: "second_visit",
    title: "Treat a second visit as a separate billable event",
    instruction:
      "The source order states that a second visit carries a second fee. Preserve that distinction in Matter financial notes rather than silently absorbing the repeat visit into the first attempt.",
  },
  {
    id: "scanback",
    phase: "completion",
    title: "Complete required scanback",
    instruction:
      "After a completed signing, scan back the executed packet as instructed while keeping the physical originals secure.",
    evidence: "Record scanback completion and file reference.",
  },
  {
    id: "return-originals",
    phase: "completion",
    title: "Preserve and return originals",
    instruction:
      "Do not shred the originals. Hold them securely until the return label or release instructions are supplied, then return them through the authorized shipment path.",
    hardStop: true,
  },
];

export const FIELD_VISIT_HARD_STOPS = [
  "No guessed notarial act.",
  "No legal advice or document alteration.",
  "No unsecured affidavit/originals left at a residence.",
  "No second visit without explicit authorization.",
  "No destruction of originals when return is required.",
  "No invented proof of contact, delivery, or execution.",
] as const;
