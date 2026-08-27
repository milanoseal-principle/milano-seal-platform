export default function CinematicSpineBackground() {
  return (
    <div
      className="ms-cinematic-atmosphere pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(198,166,91,0.16),transparent_34%),linear-gradient(180deg,#080808,#0d0d0d_48%,#080808)]" />
      <div className="ms-cinematic-grid absolute inset-0 motion-safe:opacity-20 motion-reduce:opacity-10 [background-image:linear-gradient(rgba(198,166,91,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(198,166,91,0.10)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-[#C6A65B]/25 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent,rgba(0,0,0,0.72))]" />
    </div>
  );
}
