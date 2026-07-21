"use client";

import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  LogOut,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  FileText,
} from "lucide-react";
import { APP_NAME } from "@/utils/constants";
import { useSyncStore } from "@/store/sync-store";
import { useOnlineStatus } from "@/hooks/use-online-status";
import Link from "next/link";

interface DashboardHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const { pendingCount } = useSyncStore();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-slate-900 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg border border-slate-900 shadow-[2px_2px_0px_#5cdb95]">
              S
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display">
              {APP_NAME}
            </span>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Online/Offline status badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${
                isOnline ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
              }`}
              aria-label={isOnline ? "Online" : "Offline"}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">
                    {pendingCount > 0 ? `Syncing (${pendingCount})` : "Synced"}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Offline (Saved locally)</span>
                </>
              )}
            </div>

            {/* Theme toggle */}
            {/* <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-xl border-2 border-slate-900 bg-white flex items-center justify-center hover:bg-slate-100 transition-colors shadow-[2px_2px_0px_#0f172a]"
              aria-label="Toggle theme"
            >
              <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="w-4 h-4 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button> */}

            {/* User info + Logout */}
            <div className="flex items-center gap-2 pl-2 border-l-2 border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-900 shadow-[1px_1px_0px_#5cdb95]">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-900 max-w-[120px] truncate">
                {user.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
