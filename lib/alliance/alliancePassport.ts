import type { AlliancePassportField } from "./types";

export const ALLIANCE_PASSPORT_FIELDS: AlliancePassportField[] = [
  { label: "Verified Identity", source: "verified", publicVisible: true },
  { label: "Markets Served", source: "self_attested", publicVisible: true },
  { label: "Languages", source: "self_attested", publicVisible: true },
  { label: "States", source: "self_attested", publicVisible: true },
  { label: "Countries", source: "self_attested", publicVisible: true },
  { label: "RON Enabled", source: "verified", publicVisible: true },
  { label: "Healthcare", source: "admin", publicVisible: true },
  { label: "Airport", source: "admin", publicVisible: true },
  { label: "Government", source: "admin", publicVisible: true },
  { label: "Estate Planning", source: "admin", publicVisible: true },
  { label: "Apostille", source: "admin", publicVisible: true },
  { label: "Translation", source: "admin", publicVisible: true },
  { label: "Courier", source: "admin", publicVisible: true },
  { label: "Availability", source: "system", publicVisible: false },
  { label: "Trust Score", source: "system", publicVisible: true }
];

export const ALLIANCE_LEVELS = [
  { id: "ready", label: "Alliance Ready™", requirement: "Completed onboarding." },
  { id: "verified", label: "Alliance Verified™", requirement: "Identity, licensing, and training verified." },
  { id: "professional", label: "Alliance Professional™", requirement: "Consistent QA and completed matters." },
  { id: "specialist", label: "Alliance Specialist™", requirement: "Advanced expertise in international, healthcare, government, airport, estate planning, corporate, RON, translation, or courier workflows." },
  { id: "executive", label: "Alliance Executive™", requirement: "Invitation-only status reserved for strategic partners with high performance and completed verification." }
] as const;
