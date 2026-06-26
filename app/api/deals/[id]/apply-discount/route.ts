import { NextResponse } from "next/server";
import { applyDiscountToMatter, removeDiscountFromMatter } from "@/src/features/discounts/discountService";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { code?: string; actorEmail?: string };
    if (!body.code) return NextResponse.json({ error: "Discount code is required." }, { status: 400 });
    const matter = await applyDiscountToMatter(id, body.code, body.actorEmail);
    return NextResponse.json({ matter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Discount failed." }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const actorEmail = request.headers.get("x-actor-email");
    const matter = await removeDiscountFromMatter(id, actorEmail);
    return NextResponse.json({ matter });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Discount removal failed." }, { status: 400 });
  }
}
