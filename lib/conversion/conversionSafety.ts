export const conversionSafetyRules = [
  "Wise payment status is read-only in this command center.",
  "No payment confirmed means no scheduling unlocked.",
  "Do not alter webhook, payment confirmation, release, custody, Shippo, BlueNotary, or Supabase RLS logic from conversion screens.",
  "Internal sample records must be labeled as internal sample data and must not be presented as actual revenue or actual payment status.",
];
