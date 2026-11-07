import { receivePricingRequest } from "@/lib/acquisition/pricingRequest";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return receivePricingRequest(request);
}
