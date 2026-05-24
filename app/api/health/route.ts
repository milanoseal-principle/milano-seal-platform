import { NextResponse } from "next/server";
import packageJson from "@/package.json";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "milano-seal-platform",
    environment: process.env.NODE_ENV ?? "unknown",
    version: packageJson.version ?? "0.0.0",
    timestamp: new Date().toISOString(),
  });
}
