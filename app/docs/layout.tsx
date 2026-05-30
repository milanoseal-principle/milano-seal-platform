import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Developer docs are gated to admin/operator roles only.
// Alliance partners and clients do not have access.
export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/docs");
  }

  const role =
    (user.user_metadata?.role as string | undefined) ??
    (user.app_metadata?.role as string | undefined) ??
    "";

  const allowed = ["admin", "operator", "super_admin"];
  if (!allowed.includes(role)) {
    redirect("/login?error=access_denied");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-gold" />
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-medium">
          Developer Docs — Internal Access Only
        </p>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-10">{children}</div>
    </div>
  );
}
