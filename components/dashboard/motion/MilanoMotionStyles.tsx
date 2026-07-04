"use client";

// Shared motion styles + section label for the Milano Seal cinematic motion system.
// Isolated preview building block — not wired into live routes. Demo/illustrative.

export function MilanoMotionStyles() {
  return (
    <style>{`
      .ms-motion .font-serif { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.01em; }
      .ms-motion .font-mono { font-family: 'JetBrains Mono', monospace; }

      .ms-motion .glass-sovereign {
        background: linear-gradient(135deg, rgba(20,20,26,.85) 0%, rgba(12,12,16,.95) 100%);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(212,175,55,.18);
        box-shadow:
          0 12px 48px rgba(0,0,0,.70),
          inset 0 1px 0 rgba(212,175,55,.08),
          inset 0 -1px 0 rgba(0,0,0,.50);
      }

      .ms-motion .gold-text {
        background: linear-gradient(180deg, #F4E5B8 0%, #D4AF37 50%, #B8960A 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .ms-motion .metallic-edge::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(212,175,55,.5), transparent);
      }

      @keyframes ms-rotate-slow { to { transform: rotate(360deg); } }
      @keyframes ms-rotate-reverse { to { transform: rotate(-360deg); } }
      @keyframes ms-pulse-soft {
        0%, 100% { opacity: .4; transform: scale(1); }
        50% { opacity: .8; transform: scale(1.05); }
      }
      @keyframes ms-scan-vert { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }

      .ms-motion .rotate-slow { animation: ms-rotate-slow 40s linear infinite; }
      .ms-motion .rotate-reverse { animation: ms-rotate-reverse 30s linear infinite; }
      .ms-motion .pulse-soft { animation: ms-pulse-soft 3s ease-in-out infinite; }
      .ms-motion .scan-anim { animation: ms-scan-vert 6s linear infinite; }

      .ms-motion .glow-gold { box-shadow: 0 0 24px rgba(212,175,55,.4); }
      .ms-motion .glow-emerald { box-shadow: 0 0 16px rgba(16,185,129,.5); }

      @media (prefers-reduced-motion: reduce) {
        .ms-motion .rotate-slow,
        .ms-motion .rotate-reverse,
        .ms-motion .pulse-soft,
        .ms-motion .scan-anim { animation: none !important; }
      }
    `}</style>
  );
}

export function SectionLabel({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
      <div className="flex items-baseline gap-4">
        <span className="text-[10px] font-mono text-[#D4AF37]/50 tracking-[0.3em]">/ {number}</span>
        <div>
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold text-white tracking-tight">{title}</h2>
          <p className="text-[10px] text-gray-500 tracking-[0.3em] uppercase mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="h-px flex-1 max-w-[200px] bg-gradient-to-r from-[#D4AF37]/30 to-transparent ml-4 hidden lg:block" />
    </div>
  );
}
