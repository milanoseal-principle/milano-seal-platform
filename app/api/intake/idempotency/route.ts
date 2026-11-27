import { NextRequest, NextResponse } from "next/server";
import {
  createIntakeSubmissionToken,
  INTAKE_SUBMISSION_COOKIE,
  INTAKE_SUBMISSION_COOKIE_PATH,
  INTAKE_SUBMISSION_TTL_SECONDS,
  isIntakeSubmissionToken,
} from "@/lib/intake/durableSubmissionIdempotency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function setSubmissionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(INTAKE_SUBMISSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: INTAKE_SUBMISSION_TTL_SECONDS,
    path: INTAKE_SUBMISSION_COOKIE_PATH,
  });
  return response;
}

export async function GET(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ success: false, error: "Please use the Milano website." }, { status: 403 });
  }

  const existing = request.cookies.get(INTAKE_SUBMISSION_COOKIE)?.value;
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  return isIntakeSubmissionToken(existing)
    ? response
    : setSubmissionCookie(response, createIntakeSubmissionToken());
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ success: false, error: "Please use the Milano website." }, { status: 403 });
  }

  return setSubmissionCookie(
    NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } }),
    createIntakeSubmissionToken(),
  );
}
