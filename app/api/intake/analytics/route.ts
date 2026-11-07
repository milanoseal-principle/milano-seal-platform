import { NextResponse } from "next/server";
import {
  INTAKE_ANALYTICS_EVENTS,
  buildIntakeAnalyticsPayload,
  type IntakeAnalyticsEvent,
} from "@/lib/intake/intakeAnalytics";
import { recordUxLearningEvent } from "@/lib/intelligence/ux-events";

const allowed = new Set<string>(INTAKE_ANALYTICS_EVENTS);

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    if (!raw || typeof raw.event !== "string" || !allowed.has(raw.event)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const payload = buildIntakeAnalyticsPayload(
      raw.event as IntakeAnalyticsEvent,
      raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
      typeof raw.matterId === "string" ? raw.matterId : undefined,
    );

    await recordUxLearningEvent({
      matterId: payload.matterId,
      surface: raw.event.startsWith("counsel_") ? "public_site" : "intake",
      eventType: payload.event,
      metadata: payload.metadata,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics is observational only and must never block the client workflow.
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
