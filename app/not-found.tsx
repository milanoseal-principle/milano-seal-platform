import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Header />

      <section className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#111111] border border-[#2A2A2A] mb-8">
            <FileQuestion className="w-10 h-10 text-[#C6A55A]" />
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-4">
            Page Not Found
          </h1>

          <p className="text-[#B0B0B0] text-lg mb-8">
            The page you are looking for does not exist or has been moved.
          </p>

          <Link
            href="/"
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Return Home</span>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
