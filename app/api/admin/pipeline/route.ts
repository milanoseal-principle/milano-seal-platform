import { getPipeline } from "@/lib/pipelineEngine";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const deals = await getPipeline();
    return NextResponse.json(deals);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
