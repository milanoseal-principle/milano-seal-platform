import { NextRequest, NextResponse } from "next/server";
import { findJurisdiction } from "@/lib/jurisdictions";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const j = findJurisdiction(decodeURIComponent(code));
  if (!j) {
    return NextResponse.json(
      { error: "Jurisdiction not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({
    code: j.code,
    name: j.name,
    kind: j.kind,
    region: j.region,
    flag: j.flag,
    hague: j.hague,
    ron: j.ron,
    authentication_path: j.authentication_path,
    execution_path: j.execution_path,
    typical_documents: j.typical_documents,
    witness_rules: j.witness_rules,
    summary: j.summary,
    requirements: j.requirements.map((r) => `${r.label} — ${r.value}`),
    regulations: j.regulations,
  });
}
