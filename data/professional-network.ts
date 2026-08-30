export type ProfessionalNetworkLane = {
  id: "counsel" | "execution" | "operations";
  eyebrow: string;
  title: string;
  designation: string;
  audience: string;
  promise: string;
  value: readonly string[];
  outcomes: readonly string[];
  href: string;
  cta: string;
  note: string;
};

export const PROFESSIONAL_NETWORK_LANES: readonly ProfessionalNetworkLane[] = [
  {
    id: "counsel",
    eyebrow: "International Counsel",
    title: "Milano Counsel Network™",
    designation: "Milano Counsel Network Member™",
    audience: "Foreign law firms, U.S. counsel, international advisers, private-client professionals, and cross-border operators.",
    promise: "A governed U.S.-side execution desk for international matters without forcing counsel to build the operational workflow internally.",
    value: [
      "Matter-specific execution intelligence",
      "U.S. execution and notarial coordination",
      "Authentication / apostille route control",
      "Client-ready execution instructions",
      "Receiving-authority question capture",
      "Chain-of-custody and courier visibility",
      "Evidence-backed Matter timeline",
      "Reusable firm intake pathways",
      "Priority Milano review",
      "Portfolio-level Matter visibility",
    ],
    outcomes: [
      "Reduce operational friction for cross-border matters",
      "Keep counsel focused on legal substance and client strategy",
      "Create one controlled U.S. execution point across recurring Matters",
    ],
    href: "/lawyer-access",
    cta: "Enter Counsel Experience",
    note: "Counsel remains responsible for legal substance, strategy, foreign-law requirements, and receiving-authority requirements.",
  },
  {
    id: "execution",
    eyebrow: "Execution Network",
    title: "Milano Verified Execution Partner™",
    designation: "Milano Verified Execution Partner™",
    audience: "Independent notaries, RON operators, apostille coordinators, and qualified document-execution professionals.",
    promise: "Receive structured, governed execution assignments without having to acquire, price, collect from, or operationally manage the client relationship yourself.",
    value: [
      "Qualified Matter assignments",
      "Defined scope before acceptance",
      "Verified readiness and payment posture",
      "Execution brief and document package",
      "Jurisdiction and capability routing",
      "Partner performance history",
      "Priority routing based on verified readiness",
      "Partner benefit and referral attribution",
      "Commission / payout visibility",
      "Milano SOP and Tool Belt access",
    ],
    outcomes: [
      "Spend more time executing and less time prospecting",
      "Build a verified performance record inside the network",
      "Access recurring cross-border work beyond a single local market",
    ],
    href: "/alliance/apply",
    cta: "Apply to Execution Network",
    note: "Designation is an internal Milano network status. It does not replace any state commission, license, governmental credential, or independent professional obligation.",
  },
  {
    id: "operations",
    eyebrow: "Execution Operations",
    title: "Milano Execution Coordinator™",
    designation: "Milano Execution Coordinator™",
    audience: "Remote operations professionals supporting document execution, Matter preparation, custody, courier, follow-up, and exception handling.",
    promise: "A specialized operations role with governed SOPs, real Matter responsibility, performance progression, and exposure to international execution workflows.",
    value: [
      "Structured Matter task queues",
      "SOP-driven execution training",
      "Document and packet preparation",
      "Courier and release coordination",
      "RON support workflow",
      "Escalation and exception handling",
      "Daily completion tracking",
      "Operational performance history",
      "Jurisdiction specialization pathway",
      "Progression into senior execution operations",
    ],
    outcomes: [
      "Build specialized international execution experience",
      "Operate inside a governed professional system",
      "Progress from task execution into corridor and operations leadership",
    ],
    href: "/va/apply",
    cta: "Apply to Operations Network",
    note: "This is an internal Milano operations designation and does not imply legal, notarial, governmental, or licensed professional authority.",
  },
] as const;

export const PROFESSIONAL_NETWORK_PRINCIPLES = [
  "One canonical Matter record",
  "Evidence-backed status",
  "Wise-governed payment truth",
  "Role-based access",
  "No invented professional authority",
  "No parallel execution state machine",
] as const;
