export function SourceNote({ sourceCandidates }: { sourceCandidates: string[] }) {
  return (
    <aside className="border-t border-white/10 pt-6 text-xs leading-6 text-zinc-500">
      <p className="uppercase tracking-[0.22em] text-zinc-400">Editorial source posture</p>
      <p>
        This route is held in review until an operator completes source and content
        verification. Candidate official sources are listed for review; their presence
        does not represent a verified route decision.
      </p>
      <ul className="mt-2 space-y-1">
        {sourceCandidates.map((source) => (
          <li key={source}>
            <a className="text-[#C6A55A] hover:underline" href={source} rel="noreferrer" target="_blank">
              {new URL(source).hostname}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
