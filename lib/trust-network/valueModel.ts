import type { ValueStackItem } from "./types";

export const VALUE_STACK: ValueStackItem[] = [
  { name: "Milano Seal Academy™", estimatedValue: "$997", description: "Startup curriculum, RON foundations, apostille fundamentals, international workflow basics, professional standards, and government fundamentals.", includedIn: ["seal_start", "seal_pro", "seal_elite"] },
  { name: "Smart Intake Engine™", estimatedValue: "$497", description: "Matter qualification, country routing, RON eligibility, witness determination, and apostille determination.", includedIn: ["seal_start", "seal_pro", "seal_elite"] },
  { name: "Execution QA System™", estimatedValue: "$697", description: "Pre-flight review, missing signature review, notarial wording review, witness validation, identity checklist, and release checklist.", includedIn: ["seal_start", "seal_pro", "seal_elite"] },
  { name: "SOP Library™", estimatedValue: "$1,497", description: "Operating procedures for mobile signing, RON, apostille, hospitals, nursing facilities, jails, corporate, international, and estate planning matters.", includedIn: ["seal_start", "seal_pro", "seal_elite"] },
  { name: "Government Ready Starter™", estimatedValue: "$597", description: "Vendor registration guide, procurement basics, capability statement template, and code starter guide.", includedIn: ["seal_start", "seal_pro", "seal_elite"] },
  { name: "Government Intelligence™", estimatedValue: "$1,997", description: "ITQs, RFPs, RFQs, vendor registrations, grants, certifications, and capability updates.", includedIn: ["seal_pro", "seal_elite"] },
  { name: "International Intelligence™", estimatedValue: "$2,500", description: "Country playbooks, Hague and non-Hague workflows, embassy notes, translation guidance, and corridor intelligence.", includedIn: ["seal_pro", "seal_elite"] },
  { name: "Proposal Library™", estimatedValue: "$1,497", description: "Government, healthcare, airport, corporate, attorney, enterprise, capability, pricing, and SOW templates.", includedIn: ["seal_pro", "seal_elite"] },
  { name: "Business Development OS™", estimatedValue: "$2,997", description: "CRM structures for attorneys, healthcare, government, airport, international, and enterprise pipeline tracking.", includedIn: ["seal_pro", "seal_elite"] },
  { name: "Executive AI™", estimatedValue: "$10,000+", description: "Proposal drafting, capability statements, SOW generation, pricing guidance, government readiness, and executive recommendations.", includedIn: ["seal_elite"] }
];

export const DIGITAL_PRODUCTS = [
  "SOP Library", "Templates", "Checklists", "Pricing calculators", "Quote generator", "Proposal builder", "Capability statement builder", "Government registration toolkit", "International country guides", "Compliance checklists", "Marketing assets", "Email templates", "Client intake templates", "CRM templates", "KPI dashboards"
] as const;
