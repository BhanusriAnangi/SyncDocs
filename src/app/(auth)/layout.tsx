import Link from "next/link";
import { APP_NAME, AUTHOR } from "@/utils/constants";

function GreenSquareFace() {
  return (
    <div className="w-12 h-12 bg-[#5cdb95] border-2 border-slate-900 rounded-xl relative flex items-center justify-center shadow-[3px_3px_0px_#0f172a]">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
        </div>
        <div className="w-2.5 h-2.5 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function OrangeTriangleFace() {
  return (
    <div className="w-12 h-12 bg-[#ff7043] border-2 border-slate-900 rounded-xl relative flex items-center justify-center shadow-[3px_3px_0px_#0f172a]">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
        </div>
        <div className="w-2.5 h-2.5 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function BlueSquareFace() {
  return (
    <div className="w-12 h-12 bg-[#64b5f6] border-2 border-slate-900 rounded-xl relative flex items-center justify-center shadow-[3px_3px_0px_#0f172a]">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
        </div>
        <div className="w-2.5 h-2.5 bg-white border border-slate-900 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#fbfbf9] text-slate-900 font-sans">
      {/* Left side: Neo-Brutalist Branding Panel */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r-2 border-slate-900 bg-white relative overflow-hidden">
        {/* Top Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl border-2 border-slate-900 shadow-[3px_3px_0px_#5cdb95]">
            S
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            {APP_NAME}
          </span>
        </Link>

        {/* Hero Branding Content */}
        <div className="my-12 space-y-6 max-w-md">
          <div className="flex gap-3">
            <GreenSquareFace />
            <OrangeTriangleFace />
            <BlueSquareFace />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight font-display leading-[1.15]">
            Build fast. Edit offline. Never lose data.
          </h1>

          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            Experience zero-latency local typing with Dexie IndexedDB, automated outbox sync, and Yjs CRDT conflict resolution.
          </p>

          <div className="space-y-3 pt-2">
            {[
              "⚡ Local-First IndexedDB Outbox Engine",
              "🛡️ Yjs CRDT Deterministic State Merging",
              "📜 Non-Destructive Version Time Travel",
              "🤖 Integrated Gemini AI Writing Assistant",
            ].map((feature) => (
              <div
                key={feature}
                className="p-3 rounded-xl border-2 border-slate-900 bg-[#f4f4f0] text-xs font-bold text-slate-900 shadow-[2px_2px_0px_#0f172a]"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Candidate Footer */}
        <div className="pt-6 border-t-2 border-slate-900 text-xs text-slate-600 flex items-center justify-between font-bold">
          <span>{AUTHOR.name}</span>
          <span className="text-slate-500 font-medium">House of EdTech Assessment</span>
        </div>
      </div>

      {/* Right side: Auth Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-[#f4f4f0]">
        <div className="w-full max-w-md bg-white border-2 border-slate-900 rounded-2xl p-8 shadow-[6px_6px_0px_#0f172a]">
          {children}
        </div>
      </div>
    </div>
  );
}
