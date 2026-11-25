import { randomBytes } from "node:crypto";

/** Issue opaque public references without exposing part of the Matter ID. */
export function generatePublicVerificationId(): string {
  return `MS-${new Date().getFullYear()}-${randomBytes(16).toString("hex").toUpperCase()}`;
}
