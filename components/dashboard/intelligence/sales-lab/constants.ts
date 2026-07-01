// Sales Intelligence Lab — constants + demo seed data. Demo workspace data only —
// not live dashboard, payment, courier, or matter data. Every seed carries demo:true.

import type { Account, Lead, DailyPoint, Platform, Priority, LeadSource, LeadStatus } from "./types";

export const LAB_DISCLAIMER =
  "Demo workspace data only — not live dashboard, payment, courier, or matter data.";

// Milano Seal dashboard-compatible tokens (converted from source T{}).
export const TOKENS = {
  bg: "#0A0A0A",
  surface: "#111111",
  gold: "#C6A55A",
  textPrimary: "#E8E4DC",
  textSecondary: "#8A8A8A",
  border: "#1E1E1E",
  borderStrong: "#2A2A2A",
  green: "#5B9D77",
  red: "#C2554E",
} as const;

export const PLATFORMS: Platform[] = ["instagram", "linkedin", "email", "twitter", "tiktok", "whatsapp"];
export const PRIORITIES: Priority[] = ["low", "medium", "high", "vip"];
export const ACCOUNT_STATUSES = ["new", "contacted", "qualified", "converted"] as const;
export const LEAD_SOURCES: LeadSource[] = ["dm", "content", "referral", "ads", "organic", "linkedin", "email"];
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "converted", "lost"];

export const DM_TRIGGERS = [
  "New follower",
  "Commented on post",
  "Liked 3+ posts",
  "Viewed story",
  "Warm outreach",
  "Follow-up (48h)",
  "Referral",
  "LinkedIn connection",
  "Re-engagement",
];

export const CONTENT_TYPES = ["reel", "carousel", "static post", "story", "linkedin post"];

// Demo estimate multiplier (workspace estimate only — not live revenue).
export const DEMO_VALUE_PER_CONVERSION = 875;

export const SEED_ACCOUNTS: Account[] = [
  { id: "a1", handle: "@damianianddamiani", name: "Damiani & Damiani", platform: "instagram", priority: "vip", status: "converted", dms: 4, lastContact: "2026-03-18", tags: ["italy", "law-firm", "apostille"], demo: true },
  { id: "a2", handle: "@studiomilanese", name: "Studio Milanese", platform: "linkedin", priority: "high", status: "contacted", dms: 2, lastContact: "2026-04-08", tags: ["italy", "corporate"], demo: true },
  { id: "a3", handle: "@barcelonaabogados", name: "Barcelona Abogados SL", platform: "instagram", priority: "high", status: "qualified", dms: 3, lastContact: "2026-04-10", tags: ["spain", "law-firm"], demo: true },
  { id: "a4", handle: "@relocateglobal", name: "Relocate Global", platform: "instagram", priority: "medium", status: "new", dms: 0, lastContact: null, tags: ["relocation", "hague"], demo: true },
  { id: "a5", handle: "@dubailitigation", name: "Dubai Litigation Group", platform: "linkedin", priority: "high", status: "new", dms: 1, lastContact: "2026-04-11", tags: ["uae", "executive"], demo: true },
  { id: "a6", handle: "@lisboaadvocados", name: "Lisboa Advogados", platform: "email", priority: "medium", status: "contacted", dms: 1, lastContact: "2026-04-05", tags: ["portugal", "d7-visa"], demo: true },
];

export const SEED_LEADS: Lead[] = [
  { id: "l1", name: "Lorenzo Ricci", email: "lorenzo@example.com", platform: "instagram", source: "dm", score: 88, status: "qualified", message: "Need POA apostilled for Italy citizenship", created: "2026-04-10", demo: true },
  { id: "l2", name: "Sofia Andersson", email: "sofia@example.com", platform: "linkedin", source: "content", score: 72, status: "contacted", message: "FBI background check for Portugal D7 visa", created: "2026-04-09", demo: true },
  { id: "l3", name: "Carlos Mendez", email: "carlos@example.com", platform: "instagram", source: "referral", score: 95, status: "converted", message: "3 POA documents for Mexico corporate transaction", created: "2026-04-08", demo: true },
  { id: "l4", name: "Yuki Tanaka", email: "yuki@example.com", platform: "email", source: "organic", score: 61, status: "new", message: "Apostille needed for Japan corporate filing", created: "2026-04-11", demo: true },
  { id: "l5", name: "Elena Papadopoulos", email: "elena@example.com", platform: "instagram", source: "dm", score: 79, status: "contacted", message: "One and same affidavit for Greek citizenship", created: "2026-04-07", demo: true },
];

export const SEED_DAILY: DailyPoint[] = [
  { day: "Apr 6", leads: 2, dms: 8, conversions: 0, demo: true },
  { day: "Apr 7", leads: 4, dms: 12, conversions: 1, demo: true },
  { day: "Apr 8", leads: 3, dms: 9, conversions: 2, demo: true },
  { day: "Apr 9", leads: 6, dms: 15, conversions: 1, demo: true },
  { day: "Apr 10", leads: 5, dms: 11, conversions: 3, demo: true },
  { day: "Apr 11", leads: 8, dms: 18, conversions: 2, demo: true },
  { day: "Apr 12", leads: 4, dms: 7, conversions: 1, demo: true },
];

export const OFFER_LANES = [
  { name: "Signature", price: "$750" },
  { name: "Priority", price: "$975" },
  { name: "Executive", price: "$1,850" },
];
export const OFFER_ADDONS = [
  { name: "Apostille Coordination", price: "+$250" },
  { name: "Rush Handling", price: "+$400" },
  { name: "Extra Signer", price: "+$150" },
];
export const OFFER_NOTE =
  "Internal reference only. Final quote is confirmed after document, signer, jurisdiction, apostille, and receiving-authority review.";

export const STORAGE_KEYS = {
  accounts: "milano_sales_lab_accounts",
  leads: "milano_sales_lab_leads",
} as const;
