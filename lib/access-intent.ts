export type AccessIntent =
  | { lane: "CLIENT"; matterId: string }
  | { lane: "ALLIANCE"; token: string }
  | { lane: "EMAIL"; email: string }
  | { lane: "UNKNOWN"; raw: string };

export function detectAccessIntent(raw: string): AccessIntent {
  const s = raw.trim();
  if (/^MS-\d{4}-\d+$/i.test(s))
    return { lane: "CLIENT", matterId: s.toUpperCase() };
  if (/^ALLIANCE[-_]/i.test(s))
    return { lane: "ALLIANCE", token: s.toUpperCase() };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))
    return { lane: "EMAIL", email: s.toLowerCase() };
  return { lane: "UNKNOWN", raw: s };
}
