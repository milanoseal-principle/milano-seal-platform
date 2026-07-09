export interface ReferralCapture { source: string; channel: string; matterId?: string; capturedAt: string; }
export function normalizeReferralSource(source: string): string { return source.trim().toLowerCase().replaceAll(" ", "-"); }
