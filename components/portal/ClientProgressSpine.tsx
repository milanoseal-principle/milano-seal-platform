type ClientStage = "matter" | "payment" | "signing" | "apostille" | "delivery";

const STAGES: Array<{ id: ClientStage; label: string }> = [
  { id: "matter", label: "Matter" },
  { id: "payment", label: "Payment" },
  { id: "signing", label: "Signing" },
  { id: "apostille", label: "Apostille" },
  { id: "delivery", label: "Delivery" },
];

export function ClientProgressSpine({ current }: { current: ClientStage }) {
  const currentIndex = Math.max(0, STAGES.findIndex((stage) => stage.id === current));

  return (
    <nav aria-label="Matter progress" className="w-full">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#C6A65B] md:hidden">
        {String(currentIndex + 1).padStart(2, "0")} / {String(STAGES.length).padStart(2, "0")} · {STAGES[currentIndex].label}
      </p>
      <ol className="grid grid-cols-5 gap-1" role="list">
        {STAGES.map((stage, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={stage.id} aria-current={active ? "step" : undefined}>
              <div className={`h-px w-full ${complete || active ? "bg-[#C6A65B]" : "bg-white/15"}`} />
              <span className={`mt-3 hidden text-[10px] uppercase tracking-[0.18em] md:block ${active ? "text-[#F6F1E6]" : complete ? "text-[#C6A65B]" : "text-white/40"}`}>
                {String(index + 1).padStart(2, "0")} {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
