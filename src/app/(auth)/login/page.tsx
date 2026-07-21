"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { APP_NAME } from "@/utils/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Mobile Header Logo */}
      <div className="lg:hidden mb-6 text-center">
        <h1 className="text-3xl font-black font-display text-slate-900">{APP_NAME}</h1>
        <p className="text-xs text-slate-600 font-medium mt-1">
          Local-first collaborative editor
        </p>
      </div>

      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-bold font-display text-slate-900">Welcome back</h2>
        <p className="text-xs text-slate-600 font-medium">
          Sign in to your account to open your workspace
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border-2 border-slate-900 text-red-700 text-xs font-bold shadow-[2px_2px_0px_#0f172a]" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-xs font-bold text-slate-900">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-900 bg-white text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5cdb95]"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-xs font-bold text-slate-900">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-900 bg-white text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5cdb95] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all shadow-[4px_4px_0px_#5cdb95] hover:shadow-[2px_2px_0px_#5cdb95] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LogIn size={16} />
          )}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-center text-xs font-medium text-slate-600 mt-6 pt-4 border-t border-slate-200">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-slate-900 font-bold hover:underline"
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
