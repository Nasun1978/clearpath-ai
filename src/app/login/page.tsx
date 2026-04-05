"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function enterDemo() {
    // Set a session cookie that middleware recognises for demo access
    document.cookie = "clearpath_demo=1; path=/; max-age=86400; SameSite=Lax";
    router.push("/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    }

    setLoading(false);
  }

  const inputClass =
    "w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-serif tracking-tight text-white">
            ClearPath AI
          </h1>
          <p className="text-sm text-slate-500 mt-1 tracking-wide uppercase">
            Affordable Housing Compliance Platform
          </p>
        </div>

        {/* Demo banner */}
        {DEMO_MODE && (
          <div className="mb-6 p-4 bg-teal-900/20 border border-teal-700/40 rounded-xl text-center">
            <p className="text-sm text-teal-300 font-medium mb-3">
              Demo Mode — explore the platform with sample proposals
            </p>
            <button
              onClick={enterDemo}
              className="w-full py-3 rounded-lg text-sm font-bold bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-500 hover:to-emerald-500 transition-all shadow-lg shadow-teal-900/30"
            >
              Enter Demo →
            </button>
          </div>
        )}

        {/* Auth card */}
        <div className="bg-[#0F1729] border border-slate-800 rounded-2xl p-8">
          {DEMO_MODE && (
            <p className="text-xs text-slate-600 text-center mb-4">
              Or sign in with your account below
            </p>
          )}
          <h2 className="text-lg font-semibold text-white mb-6">
            {mode === "signin" ? "Sign in to your account" : "Create an account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                className={inputClass}
                placeholder="you@agency.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className={inputClass}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-900/40 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-teal-900/20 border border-teal-900/40 rounded-lg text-sm text-teal-400">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-light disabled:opacity-50 transition-colors mt-2"
            >
              {loading
                ? mode === "signin" ? "Signing in..." : "Creating account..."
                : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
                  className="text-teal-400 hover:text-teal-300 font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => { setMode("signin"); setError(null); setMessage(null); }}
                  className="text-teal-400 hover:text-teal-300 font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Built by REO, LLC · Government use only
        </p>
      </div>
    </div>
  );
}
