"use client";

import React, { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg("Supabase client not configured.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-zinc-950 via-slate-900 to-indigo-950 px-6 py-12 font-sans relative overflow-hidden">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 bg-indigo-500 rounded-full blur-[120px] opacity-25 -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-purple-500 rounded-full blur-[140px] opacity-20 -z-10" />

      {/* Login Card */}
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 md:p-10 shadow-2xl text-white relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-20 w-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg border border-white/20">
          <ShieldCheck className="h-10 w-10 text-white" />
        </div>

        <div className="text-center mt-8">
          <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-50 flex items-center justify-center gap-2">
            Sign in to my-POS
          </h1>
          <p className="mt-2 text-xs font-semibold text-indigo-200/70">
            Enter your cashier or admin credentials to start your shift.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs font-bold text-red-300 animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-4xs font-black uppercase tracking-widest text-indigo-300">
                Email Address
              </label>
              <div className="relative mt-2">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="cashier@mypos.com or admin@mypos.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-indigo-400 focus:bg-white/10 transition-all text-white placeholder-zinc-500 font-semibold"
                />
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-4xs font-black uppercase tracking-widest text-indigo-300">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-xs outline-none focus:border-indigo-400 focus:bg-white/10 transition-all text-white placeholder-zinc-500 font-semibold"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-center text-xs font-black uppercase tracking-widest text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 active:scale-[0.98] mt-2 border border-white/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" /> Authorizing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" /> Authorize & Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo Accounts Details Block */}
        <div className="mt-8 rounded-2xl bg-white/5 p-5 text-2xs text-indigo-200 border border-white/5 leading-relaxed">
          <p className="font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
            🔑 Demo Operator Credentials:
          </p>
          <ul className="mt-2.5 space-y-1.5 font-medium">
            <li className="flex justify-between items-center bg-white/5 rounded-lg px-2.5 py-1">
              <span>Admin:</span>
              <code className="text-white bg-white/10 px-2 py-0.5 rounded font-mono">alice@mypos.com</code>
            </li>
            <li className="flex justify-between items-center bg-white/5 rounded-lg px-2.5 py-1">
              <span>Cashier:</span>
              <code className="text-white bg-white/10 px-2 py-0.5 rounded font-mono">charlie@mypos.com</code>
            </li>
            <li className="text-3xs text-indigo-300/80 mt-2 text-center">
              Password setup: Reset these users inside the Supabase Console.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
