export type NotarialAct =
  | "acknowledgment"
  | "jurat"
  | "copy_certification"
  | "oath_affirmation"
  | "representative_acknowledgment";

export type CertificateTemplate = {
  id: string;
  act: NotarialAct;
  state: string;
  destinationType: "apostille" | "consulate" | "domestic" | "any";
  label: string;
  description: string;
  template_text: string;
  ron_eligible: boolean;
  physical_eligible: boolean;
  operator_approval_required: boolean;
  restrictions?: string;
};

const CERTIFICATE_TEMPLATES: CertificateTemplate[] = [
  {
    id: "fl_ron_acknowledgment",
    act: "acknowledgment",
    state: "florida",
    destinationType: "any",
    label: "Florida RON Acknowledgment",
    description:
      "Standard Florida acknowledgment certificate for Remote Online Notarization sessions.",
    template_text:
      "State of Florida\nCounty of ___________\n\nBefore me, the undersigned notary public, personally appeared ___________ (name of person acknowledging), who is personally known to me or who has produced ___________ as identification, and who acknowledged before me that he/she/they executed the foregoing instrument for the purposes therein expressed.\n\nWitness my hand and official seal this ___ day of ___________, 20___.\n\n___________________________\nNotary Public, State of Florida\nPrinted Name: ___________________________\nMy Commission Expires: ___________________________\nCommission No.: ___________________________",
    ron_eligible: true,
    physical_eligible: true,
    operator_approval_required: true,
    restrictions:
      "For use with Florida notarial acts. Remote Online Notarization version — ensure RON platform session ID is recorded.",
  },
  {
    id: "fl_physical_acknowledgment",
    act: "acknowledgment",
    state: "florida",
    destinationType: "any",
    label: "Florida Physical Acknowledgment",
    description:
      "Standard Florida acknowledgment certificate for in-person notarization. Physical presence required.",
    template_text:
      "State of Florida\nCounty of ___________\n\nBefore me, the undersigned notary public, personally appeared ___________ (name of person acknowledging), who is personally known to me or who has produced ___________ as identification, and who acknowledged before me that he/she/they executed the foregoing instrument for the purposes therein expressed. Physical presence required.\n\nWitness my hand and official seal this ___ day of ___________, 20___.\n\n___________________________\nNotary Public, State of Florida\nPrinted Name: ___________________________\nMy Commission Expires: ___________________________\nCommission No.: ___________________________",
    ron_eligible: false,
    physical_eligible: true,
    operator_approval_required: true,
    restrictions:
      "For in-person notarization only. Do not use for RON sessions.",
  },
  {
    id: "fl_ron_jurat",
    act: "jurat",
    state: "florida",
    destinationType: "any",
    label: "Florida RON Jurat",
    description:
      "Florida jurat certificate for sworn statements via Remote Online Notarization.",
    template_text:
      "State of Florida\nCounty of ___________\n\nSworn to (or affirmed) and subscribed before me by means of [☐ physical presence] [☐ online notarization] this ___ day of ___________, 20___, by ___________ (name of affiant).\n\n___________________________\nNotary Public, State of Florida\nPrinted Name: ___________________________\nMy Commission Expires: ___________________________\nCommission No.: ___________________________",
    ron_eligible: true,
    physical_eligible: true,
    operator_approval_required: true,
  },
  {
    id: "fl_representative_acknowledgment",
    act: "representative_acknowledgment",
    state: "florida",
    destinationType: "any",
    label: "Florida Representative Acknowledgment",
    description:
      "Florida acknowledgment certificate for signers acting in a representative capacity on behalf of an entity.",
    template_text:
      "State of Florida\nCounty of ___________\n\nBefore me, the undersigned notary public, personally appeared ___________, as ___________ of ___________, and acknowledged before me that he/she/they executed the foregoing instrument on behalf of said entity for the purposes therein expressed, and that he/she/they had authority to do so.\n\nWitness my hand and official seal this ___ day of ___________, 20___.\n\n[Notary signature block]",
    ron_eligible: true,
    physical_eligible: true,
    operator_approval_required: true,
  },
  {
    id: "fl_oath_affirmation",
    act: "oath_affirmation",
    state: "florida",
    destinationType: "any",
    label: "Florida Oath / Affirmation",
    description:
      "Florida oath or affirmation wording for use at the start of sworn testimony or affidavit execution.",
    template_text:
      "OATH: Do you solemnly swear that the contents of this document are true, so help you God?\nAFFIRMATION: Do you solemnly affirm, under penalty of perjury, that the contents of this document are true?",
    ron_eligible: true,
    physical_eligible: true,
    operator_approval_required: true,
  },
];

export function selectCertificate(
  act: NotarialAct,
  state: string,
  destination: string,
  ronSession: boolean
): CertificateTemplate[] {
  const normalizedState = state.toLowerCase();
  const normalizedDest = destination.toLowerCase();

  return CERTIFICATE_TEMPLATES.filter((t) => {
    if (t.act !== act) return false;
    if (t.state !== normalizedState && t.state !== "federal") return false;
    if (
      t.destinationType !== "any" &&
      t.destinationType !== normalizedDest
    )
      return false;
    if (ronSession && !t.ron_eligible) return false;
    return true;
  }).sort((a, b) => {
    // Prefer RON-eligible templates when ronSession is true
    if (ronSession) {
      if (a.ron_eligible && !b.ron_eligible) return -1;
      if (!a.ron_eligible && b.ron_eligible) return 1;
    }
    return 0;
  });
}
