"use client"

import Head from "next/head"

import WorldMap from "@/components/WorldMap"

import { useRouter } from "next/navigation"

export default function Home() {

  const router = useRouter()

  return (

    <>

      <Head>

        <title>The Milano Seal™ | International Apostille & Notary</title>

        <meta

          name="description"

          content="Luxury international document execution, apostille coordination, and remote online notarization."

        />

      </Head>

      <main className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center px-6 py-12">

        {/* HERO */}

        <section className="w-full max-w-5xl text-center space-y-6">

          <h1 className="text-4xl md:text-5xl font-serif tracking-wide">

            THE MILANO SEAL™

          </h1>

          <p className="text-lg text-gray-300 max-w-2xl mx-auto">

            Luxury Legal Execution & International Apostille Authority

          </p>

          <p className="text-sm text-gray-400 max-w-xl mx-auto">

            International Document Execution • Remote Online Notarization • Apostille Coordination

          </p>

          {/* CTA BUTTONS */}

          <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">

            <button

              onClick={() => router.push("/intake")}

              className="bg-[#C6A55A] text-black px-6 py-3 rounded-md font-medium hover:opacity-90 transition"

            >

              Start Document Review

            </button>

            <button

              onClick={() => router.push("/intake")}

              className="border border-[#C6A55A] text-[#C6A55A] px-6 py-3 rounded-md hover:bg-[#C6A55A] hover:text-black transition"

            >

              Start Apostille Process

            </button>

            <button

              onClick={() => router.push("/intake")}

              className="border border-gray-500 text-gray-300 px-6 py-3 rounded-md hover:bg-gray-700 transition"

            >

              Schedule Notarization

            </button>

          </div>

        </section>

        {/* MAP SECTION */}

        <section className="w-full max-w-6xl mt-16">

          <div className="text-center mb-6">

            <h2 className="text-xl text-[#C6A55A] tracking-wide">

              Select Destination Country

            </h2>

          </div>

          <WorldMap />

        </section>

        {/* SERVICE SUMMARY */}

        <section className="w-full max-w-5xl mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">

          <div className="space-y-3">

            <h3 className="text-[#C6A55A] text-lg">Remote Online Notary</h3>

            <p className="text-sm text-gray-400">

              Secure, compliant notarization from anywhere.

            </p>

          </div>

          <div className="space-y-3">

            <h3 className="text-[#C6A55A] text-lg">Apostille Coordination</h3>

            <p className="text-sm text-gray-400">

              Full-service handling of international document authentication.

            </p>

          </div>

          <div className="space-y-3">

            <h3 className="text-[#C6A55A] text-lg">International Execution</h3>

            <p className="text-sm text-gray-400">

              Cross-border legal document preparation and routing.

            </p>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="mt-24 text-center text-xs text-gray-500">

          © {new Date().getFullYear()} The Milano Seal™

        </footer>

      </main>

    </>

  )

}
