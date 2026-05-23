import { createClient } from "@/lib/supabase/server";
import { roleFromEmail, type Role } from "@/lib/rbac";
import { NextResponse } from "next/server";

export interface ActorContext {
  userId: string;
  email: string;
  role: Role;
}

type GuardSuccess = { actor: ActorContext };
type GuardFailure = { response: NextResponse };
export type GuardResult = GuardSuccess | GuardFailure;

export function isGuardFailure(result: GuardResult): result is GuardFailure {
  return "response" in result;
}

export async function getActorContext(): Promise<ActorContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    return {
      userId: user.id,
      email: user.email,
      role: roleFromEmail(user.email),
    };
  } catch {
    return null;
  }
}

// Requires admin or operator role. Rejects client and anonymous sessions.
export async function requireOperator(): Promise<GuardResult> {
  const actor = await getActorContext();
  if (!actor) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (actor.role !== "admin" && actor.role !== "operator") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { actor };
}

// Requires admin role only.
export async function requireAdmin(): Promise<GuardResult> {
  const actor = await getActorContext();
  if (!actor) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (actor.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { actor };
}

// Requires authenticated session with operator role OR email ownership of a deal.
// Used for endpoints that clients may need to access for their own matters.
export async function requireOperatorOrSelf(
  dealEmail: string | null
): Promise<GuardResult> {
  const actor = await getActorContext();
  if (!actor) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (actor.role === "admin" || actor.role === "operator") {
    return { actor };
  }
  if (
    dealEmail &&
    actor.email.toLowerCase() === dealEmail.toLowerCase()
  ) {
    return { actor };
  }
  return {
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  };
}
