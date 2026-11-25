import { receiveSalesCapture } from "@/lib/acquisition/salesCapture";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return receiveSalesCapture(request);
}
