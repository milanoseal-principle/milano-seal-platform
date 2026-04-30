'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  console.error(error)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <h1 className="text-xl mb-4">System Error</h1>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-[#C6A55A] text-black"
      >
        Retry
      </button>
    </div>
  )
}
