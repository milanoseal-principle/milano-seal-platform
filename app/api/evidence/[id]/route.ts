import { NextRequest, NextResponse } from "next/server";
import { generateEvidencePacket } from "@/lib/evidencePacket";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const pdfBytes = await generateEvidencePacket(id);

    await logActivity({
      deal_id: id,
      action: "system",
      detail: "Evidence packet generated",
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="milano-seal-evidence-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[evidence] error:", msg);
    return NextResponse.json(
      { error: "Failed to generate evidence packet", details: msg },
      { status: 500 },
    );
  }
}
