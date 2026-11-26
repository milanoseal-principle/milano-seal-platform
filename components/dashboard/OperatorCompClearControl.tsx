import Link from "next/link";

export function OperatorCompClearControl() {
  return (
    <p className="my-4 text-sm text-white/70">
      Open the Matter to manage complimentary authorization in its payment controls.{" "}
      <Link href="/dashboard/deals" className="text-[#E4D2A4] underline">
        Open Matters
      </Link>
    </p>
  );
}
