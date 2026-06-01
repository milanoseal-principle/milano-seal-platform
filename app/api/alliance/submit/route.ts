import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partner_name, firm, email, role, corridors, observation, source_url } = body;

    if (!partner_name || !email || !observation) {
      return NextResponse.json(
        { error: "partner_name, email, and observation are required" },
        { status: 400 },
      );
    }

    // Log the observation — in a real system this would write to DB
    // For now: return success and log to console (no DB migration needed)
    console.log("[ALLIANCE_OBSERVATION_SUBMITTED]", {
      partner_name,
      firm,
      email: email.substring(0, 3) + "***", // mask email in logs
      role,
      corridors,
      observation: observation.substring(0, 100),
      source_url,
      submitted_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message:
        "Observation received. The Milano Seal team will review and follow up.",
      reference: `OBS-${Date.now().toString(36).toUpperCase()}`,
    });
  } catch {
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
