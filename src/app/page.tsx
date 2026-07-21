import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  FileText,
  ArrowRight,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { APP_NAME, APP_DESCRIPTION, AUTHOR } from "@/utils/constants";

/* ─── Playful Geometric Shape Components with Eyes ─── */

function GreenSquareFace() {
  return (
    <div className="w-14 h-14 bg-[#5cdb95] border-2 border-slate-900 rounded-xl relative flex items-center justify-center shadow-[3px_3px_0px_#0f172a] transform -rotate-3 hover:rotate-0 transition-transform">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
        <div className="w-3 h-3 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function OrangeTriangleFace() {
  return (
    <div className="w-14 h-14 bg-[#ff7043] border-2 border-slate-900 rounded-xl relative flex items-center justify-center shadow-[3px_3px_0px_#0f172a] transform rotate-6 hover:rotate-0 transition-transform">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
        <div className="w-3 h-3 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function BlueSquareFace() {
  return (
    <div className="w-14 h-14 bg-[#64b5f6] border-2 border-slate-900 rounded-xl relative flex items-center justify-center shadow-[3px_3px_0px_#0f172a] transform -rotate-6 hover:rotate-0 transition-transform">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
        <div className="w-3 h-3 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function YellowPillFace() {
  return (
    <div className="w-14 h-14 bg-[#ffd54f] border-2 border-slate-900 rounded-xl relative flex items-center justify-center shadow-[3px_3px_0px_#0f172a] transform rotate-3 hover:rotate-0 transition-transform">
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
        <div className="w-3 h-3 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9] text-slate-900 selection:bg-[#5cdb95]/40 selection:text-slate-900 font-sans">
      {/* ─── 1. NAVBAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#fbfbf9]/90 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg border border-slate-900 shadow-[2px_2px_0px_#5cdb95]">
                S
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                {APP_NAME}
              </span>
            </Link>

            {/* CTA */}
            <div className="flex items-center gap-3">
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-[2px_2px_0px_#5cdb95] flex items-center gap-1.5"
                >
                  Dashboard
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-full text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-[2px_2px_0px_#5cdb95] flex items-center gap-1.5"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ───────────────────────────────────── */}
      <section className="flex-1 relative py-20 sm:py-32 px-4 flex items-center justify-center overflow-hidden border-b border-slate-200 bg-white">
        {/* Left Decorative Shape Blocks */}
        <div className="hidden lg:flex flex-col gap-4 absolute top-20 left-12 pointer-events-none">
          <GreenSquareFace />
          <OrangeTriangleFace />
        </div>

        {/* Right Decorative Shape Blocks */}
        <div className="hidden lg:flex flex-col gap-4 absolute top-20 right-12 pointer-events-none">
          <BlueSquareFace />
          <YellowPillFace />
        </div>

        <div className="max-w-3xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold tracking-wide uppercase">
            <span>Powered by</span>
            <span className="text-orange-600 font-extrabold">Local-First</span>
            <span>+ Yjs CRDT</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] font-display text-[52px] sm:text-[68px]">
            Make everyone on your team a builder
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
            {APP_DESCRIPTION} Instant typing with zero UI latency, automatic offline sync, and deterministic CRDT conflict resolution.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4">
            <Link
              href={session?.user ? "/dashboard" : "/register"}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-[4px_4px_0px_#5cdb95] hover:shadow-[2px_2px_0px_#5cdb95] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              Get started
            </Link>
          </div>

          {/* Key Architectural Highlights */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div className="p-4 rounded-xl border-2 border-slate-900 bg-[#f4f4f0] shadow-[3px_3px_0px_#0f172a] space-y-1">
              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-green-600" /> IndexedDB
              </div>
              <p className="text-[11px] text-slate-600 font-medium">Local-first memory outbox</p>
            </div>

            <div className="p-4 rounded-xl border-2 border-slate-900 bg-[#f4f4f0] shadow-[3px_3px_0px_#0f172a] space-y-1">
              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-green-600" /> Yjs CRDT
              </div>
              <p className="text-[11px] text-slate-600 font-medium">Zero data loss merge</p>
            </div>

            <div className="p-4 rounded-xl border-2 border-slate-900 bg-[#f4f4f0] shadow-[3px_3px_0px_#0f172a] space-y-1">
              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-green-600" /> Time Travel
              </div>
              <p className="text-[11px] text-slate-600 font-medium">Safe version history</p>
            </div>

            <div className="p-4 rounded-xl border-2 border-slate-900 bg-[#f4f4f0] shadow-[3px_3px_0px_#0f172a] space-y-1">
              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
                <CheckCircle2 size={14} className="text-green-600" /> Gemini AI
              </div>
              <p className="text-[11px] text-slate-600 font-medium">Built-in writing assistant</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. DARK SUBSCRIBE BANNER ───────────────────────────── */}
      <section className="py-16 px-4 bg-[#18181b] text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-2xl font-bold font-display">Subscribe to updates</h2>
            <p className="text-xs text-zinc-400">Do not miss any new version releases or architecture updates.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2.5 rounded-full bg-zinc-800 border border-zinc-700 text-white text-xs placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#5cdb95] w-full md:w-64"
            />
            <button className="px-6 py-2.5 rounded-full bg-[#5cdb95] text-slate-900 font-bold text-xs hover:bg-[#4bc783] transition-colors flex-shrink-0">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* ─── 4. VIBRANT GREEN FOOTER WITH CANDIDATE PROFILE ─────── */}
      <footer className="bg-[#41b883] text-slate-900 border-t-2 border-slate-900 py-12 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Candidate Profile Details Card */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_#0f172a] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-xl font-extrabold text-slate-900 font-display">
                  {AUTHOR.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#5cdb95] text-slate-900 border border-slate-900">
                  <MapPin size={11} />
                  {AUTHOR.location}
                </span>
              </div>
              <p className="text-xs text-slate-700 font-bold">
                {AUTHOR.title}
              </p>
            </div>

            {/* Direct Links and Contact */}
            <div className="flex flex-col gap-2 text-xs font-bold text-center md:text-right">
              <div>
                <span className="cursor-default">📞 {AUTHOR.phone}</span>
                <span className="mx-2 cursor-default">|</span>
                <a href={`mailto:${AUTHOR.email}`} className="hover:underline cursor-pointer">
                  ✉️ {AUTHOR.email}
                </a>
              </div>
              <div>
                <a
                  href={AUTHOR.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-900 hover:underline break-all cursor-pointer"
                >
                  {AUTHOR.portfolio}
                </a>
              </div>
              <div>
                <a
                  href={AUTHOR.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-900 hover:underline break-all cursor-pointer"
                >
                  {AUTHOR.linkedin}
                </a>
              </div>
            </div>
          </div>

          {/* Giant Outlined Logo Banner */}
          <div className="text-center select-none pt-4">
            <h1 className="text-6xl sm:text-9xl font-black tracking-tighter font-display text-slate-900/15 uppercase">
              {APP_NAME}
            </h1>
            <p className="text-xs font-bold text-slate-900/70 mt-2">
              House of EdTech — Fullstack Developer Technical Assessment (v2.1)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
