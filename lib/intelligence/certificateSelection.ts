export interface CertificateTemplate {
  id: string;
  label: string;
  state: string;
  act: string;
  description: string;
  requiresRON: boolean;
  destinationRestrictions?: string[];
}

export interface CertificateSelectionResult {
  recommended: CertificateTemplate | null;
  alternatives: CertificateTemplate[];
  reason: string;
}

const TEMPLATES: CertificateTemplate[] = [
  { id: "fl_ron_ack", label: "Florida RON Acknowledgment", state: "FL", act: "acknowledgment", description: "For remotely notarized acknowledgments in Florida.", requiresRON: true },
  { id: "fl_physical_ack", label: "Florida Physical Acknowledgment", state: "FL", act: "acknowledgment", description: "For in-person notarized acknowledgments in Florida.", requiresRON: false },
  { id: "fl_ron_jurat", label: "Florida RON Jurat", state: "FL", act: "jurat", description: "For sworn statements via remote notarization.", requiresRON: true },
  { id: "fl_rep_ack", label: "Florida Representative Acknowledgment", state: "FL", act: "acknowledgment", description: "For entities signing through a representative.", requiresRON: false },
  { id: "fl_oath", label: "Florida Oath / Affirmation", state: "FL", act: "oath", description: "For oaths and affirmations.", requiresRON: false },
];

export function selectCertificate(params: { state: string; act: string; isRON: boolean; destinationCountry?: string }): CertificateSelectionResult {
  const candidates = TEMPLATES.filter(t => t.state === params.state && t.act === params.act && t.requiresRON === params.isRON);
  if (candidates.length === 0) {
    const fallback = TEMPLATES.filter(t => t.state === params.state && t.act === params.act);
    return { recommended: null, alternatives: fallback, reason: "No exact match. Review alternatives." };
  }
  return { recommended: candidates[0], alternatives: candidates.slice(1), reason: "System suggests. Operator approves." };
}
