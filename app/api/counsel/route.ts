import { receiveCounselInquiry } from "@/lib/counsel/receive";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return receiveCounselInquiry(request);
}
