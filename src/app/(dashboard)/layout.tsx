import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AUTHOR, APP_NAME } from "@/utils/constants";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MapPin } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbf9] text-slate-900">
      <DashboardHeader user={session.user} />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {children}
      </main>

      {/* ─── VIBRANT GREEN NEO-BRUTALIST FOOTER ─────────────────── */}
      <footer className="bg-[#41b883] text-slate-900 border-t-2 border-slate-900 py-12 px-4 relative overflow-hidden mt-12">
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
