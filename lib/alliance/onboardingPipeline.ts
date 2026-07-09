import type { AlliancePipelineStep } from "./types";

export const ALLIANCE_ONBOARDING_PIPELINE: AlliancePipelineStep[] = [
  { order: 1, label: "Application", required: true, description: "Applicant submits professional profile, service categories, market coverage, and readiness documents." },
  { order: 2, label: "Preliminary Review", required: true, description: "Internal review confirms fit, coverage, and professional alignment." },
  { order: 3, label: "Identity Verification", required: true, description: "Identity is verified before any public profile or routing eligibility." },
  { order: 4, label: "License Verification", required: true, description: "Commission, RON status, or role-specific credentials are reviewed when applicable." },
  { order: 5, label: "Compliance Review", required: false, description: "Background, insurance, facility, or enterprise requirements are checked when required for the role." },
  { order: 6, label: "Interview", required: true, description: "Applicant confirms process standards, response expectations, and communication requirements." },
  { order: 7, label: "Operating Agreement", required: true, description: "Agreement establishes independent status, service standards, confidentiality, and no-guarantee terms." },
  { order: 8, label: "OS Training", required: true, description: "Partner completes Milano Seal operating workflow orientation." },
  { order: 9, label: "Execution QA Certification", required: true, description: "Partner completes execution quality assurance training before live deployment eligibility." },
  { order: 10, label: "Profile Activation", required: true, description: "Profile activates only after required review steps are complete." },
  { order: 11, label: "Trust Score Initialized", required: true, description: "Initial score is created from readiness, verification, training, and communication data." },
  { order: 12, label: "Live Deployment", required: false, description: "Partner becomes eligible for routing consideration without any assignment guarantee." }
];
