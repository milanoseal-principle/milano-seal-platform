import Link from "next/link";
import { MilanoProductState, milanoStateActionClass } from "@/components/system/MilanoProductState";

export default function NotFound() {
  return (
    <main className="min-h-[100dvh] bg-[#060608] text-[#F4F1EA]">
      <MilanoProductState
        eyebrow="The Milano Seal™ · Route unavailable"
        title="This destination is not available"
        description="The page may have moved, or the route may no longer belong to the current client journey. Continue from a canonical Milano Seal entry point."
        tone="gold"
        actions={
          <>
            <Link
              href="/"
              className={`${milanoStateActionClass} border-[#C6A65B]/40 bg-[#C6A65B]/[0.08] text-[#F4F1EA] hover:border-[#C6A65B]/65 hover:bg-[#C6A65B]/[0.12]`}
            >
              Return home
            </Link>
            <Link
              href="/global-document-intelligence"
              className={`${milanoStateActionClass} border-white/10 bg-white/[0.025] text-white/62 hover:border-white/20 hover:bg-white/[0.045] hover:text-white/88`}
            >
              Open Global Intelligence
            </Link>
            <Link
              href="/intake"
              className={`${milanoStateActionClass} border-white/10 bg-white/[0.025] text-white/62 hover:border-white/20 hover:bg-white/[0.045] hover:text-white/88`}
            >
              Begin secure intake
            </Link>
          </>
        }
      />
    </main>
  );
}
