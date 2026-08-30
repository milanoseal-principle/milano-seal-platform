import { NextRequest, NextResponse } from "next/server";
import { getSearchConsoleConfiguration } from "@/lib/seo/search-console/client";
import { finalizedSearchConsoleWindow, syncSearchConsole } from "@/lib/seo/search-console/sync";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  if (!getSearchConsoleConfiguration().configured) return NextResponse.json({ ok: false, code: "SEARCH_CONSOLE_UNCONFIGURED" }, { status: 503 });
  const window = finalizedSearchConsoleWindow();
  try { return NextResponse.json({ ok: true, ...(await syncSearchConsole({ ...window, triggerType: "CRON" })) }); }
  catch { return NextResponse.json({ ok: false, code: "SEARCH_CONSOLE_SYNC_FAILED", ...window }, { status: 502 }); }
}
