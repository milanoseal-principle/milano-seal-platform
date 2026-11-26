import { createClient } from "@/lib/supabase/server";
import { retiredCompClearResponse } from "@/lib/discounts/compClear";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return retiredCompClearResponse(user);
}
