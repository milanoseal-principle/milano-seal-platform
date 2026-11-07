import { receiveConciergeInquiry } from "@/lib/acquisition/concierge";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return receiveConciergeInquiry(request);
}