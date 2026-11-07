import { receivePricingUpload } from "@/lib/acquisition/pricingUpload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return receivePricingUpload(request);
}
