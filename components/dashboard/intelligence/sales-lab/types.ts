// Sales Intelligence Lab — types. Internal demo workspace only.

export type Platform = "instagram" | "linkedin" | "email" | "twitter" | "tiktok" | "whatsapp";
export type Priority = "low" | "medium" | "high" | "vip";
export type AccountStatus = "new" | "contacted" | "qualified" | "converted";
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";
export type LeadSource = "dm" | "content" | "referral" | "ads" | "organic" | "linkedin" | "email";
export type LeadPriority = "low" | "medium" | "high";

export interface Account {
  id: string;
  handle: string;
  name: string;
  platform: Platform;
  priority: Priority;
  status: AccountStatus;
  dms: number;
  lastContact: string | null;
  tags: string[];
  demo: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  platform: Platform;
  source: LeadSource;
  message: string;
  score: number;
  status: LeadStatus;
  created: string;
  reasoning?: string;
  demo: boolean;
}

export interface DailyPoint {
  day: string;
  leads: number;
  dms: number;
  conversions: number;
  demo: boolean;
}

export type SalesLabTab = "snapshot" | "ecosystem" | "dm" | "content" | "leads" | "offers";

export type GenerateMode = "dm" | "content" | "lead_score";

export interface DMOutput {
  opener: string;
  authority: string;
  pivot: string;
  followup: string;
  full_message: string;
}
export interface ContentOutput {
  hook: string;
  caption: string;
  cta: string;
  hashtags: string[];
}
export interface LeadScoreOutput {
  score: number;
  reasoning: string;
  priority: LeadPriority;
}
