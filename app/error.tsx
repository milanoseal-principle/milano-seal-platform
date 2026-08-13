'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-[100dvh] bg-[#060608] px-5 py-12 text-[#F4F1EA] sm:px-6">
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-2xl flex-col justify-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#D8C188]/70">
          The Milano Seal™ · Recovery
        </div>
        <h1 className="mt-3 font-serif text-2xl font-normal sm:text-3xl">
          This view could not be completed
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
          The current screen encountered an unexpected error. Retry the view; no successful transaction should be inferred from this screen.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
            Reference · {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-7 min-h-11 w-fit rounded-md border border-[#D8C188]/35 bg-[#D8C188]/[0.06] px-5 text-sm font-medium text-[#F4F1EA] transition-colors hover:border-[#D8C188]/60 hover:bg-[#D8C188]/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D8C188]"
        >
          Retry view
        </button>
      </div>
    </main>
  )
}
