"use client"

import { GlobalMap } from "@/components/landing/global-map"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center px-6 py-12">

      {/* HERO */}
      <section className="text-center space-y-6 max-w-4xl">

        <h1 className="text-4xl md:text-5xl font-serif tracking-wide">
          THE MILANO SEAL™
        </h1>

        <p className="text-gray-400 max-w-xl mx-auto">
          Luxury Legal Execution & International Apostille Authority
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center pt-4">

          <button
            onClick={() => router.push("/intake")}
            className="bg-[#C6A55A] text-black px-6 py-3 rounded-md"
          >
            Start Document Review
          </button>

          <button
            onClick={() => router.push("/intake")}
            className="border border-[#C6A55A] text-[#C6A55A] px-6 py-3 rounded-md"
          >
            Start Apostille Process
          </button>

        </div>

      </section>

      {/* MAP */}
      <section className="w-full max-w-6xl mt-16">
        <GlobalMap />
      </section>

      {/* FOOTER */}
      <footer className="mt-20 text-xs text-gray-500">
        © {new Date().getFullYear()} The Milano Seal™
      </footer>

    </main>
  )
}
