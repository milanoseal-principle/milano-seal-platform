import { NextRequest, NextResponse } from "next/server";
import { parseFiles } from "@/lib/ai/fileParser";
import { extractIntake } from "@/lib/ai/intakeExtractor";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILES = 10;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid form data" },
      { status: 400 },
    );
  }

  const message = (formData.get("message") as string | null) || "";
  const fileEntries = formData.getAll("files").filter((f): f is File => {
    return typeof f === "object" && f !== null && "arrayBuffer" in f;
  });

  if (!message.trim() && fileEntries.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Provide either a message or at least one file" },
      { status: 400 },
    );
  }

  const batch = fileEntries.slice(0, MAX_FILES);

  const parsed = await parseFiles(batch);

  const usableBlocks = parsed
    .filter((p) => p.ok)
    .flatMap((p) => (p.textBlock ? [p.block, p.textBlock] : [p.block]));

  let extraction;
  try {
    extraction = await extractIntake({
      message,
      fileBlocks: usableBlocks,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error ? e.message : "Extraction failed unexpectedly",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    extraction,
    files: parsed.map((p) => ({
      name: p.name,
      size: p.size,
      mime: p.mime,
      parsed: p.ok,
      error: p.error,
    })),
  });
}
