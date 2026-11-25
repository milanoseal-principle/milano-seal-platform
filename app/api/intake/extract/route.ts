import { NextRequest } from "next/server";
import { parseFiles } from "@/lib/ai/fileParser";
import { handleIntakeExtract } from "@/lib/ai/intakeExtractHandler";
import { extractIntake } from "@/lib/ai/intakeExtractor";

export const runtime = "nodejs";
export const maxDuration = 60;

// Public, same-origin intake pre-read. Origin, size and off-switch guards run in
// handleIntakeExtract before any file is parsed or a paid provider is called.
export async function POST(req: NextRequest) {
  return handleIntakeExtract(req, { env: process.env, parseFiles, extractIntake });
}
