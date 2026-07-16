"use client";

import React, { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, User } from "lucide-react";

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-sky-400 via-pink-500 via-purple-600 to-indigo-950 px-6 font-sans relative overflow-hidden">
      
      {/* Mountain Landscape Background Silhouette (CSS Mock) */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 opacity-40">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[180px]">
          <path d="M0,0 C150,90 350,20 500,80 C650,140 850,40 1000,90 C1150,140 1200,80 1200,80 L1200,120 L0,120 Z" fill="#2e1065"></path>
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 opacity-20">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[220px]">
          <path d="M0,30 C200,120 400,10 600,90 C800,170 1000,30 1200,80 L1200,120 L0,120 Z" fill="#1e1b4b"></path>
        </svg>
      </div>

      {/* Top Brand Name */}
      <header className="absolute top-0 left-0 w-full px-10 py-6 z-10 text-white/95">
        <span className="text-lg font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-pink-200">my-POS</span>
      </header>

      {/* Center Registration/Login Card */}
      <div className="w-full max-w-[480px] rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-8 md:p-10 shadow-2xl text-white relative z-10 mt-12">
        <div className="text-center mb-7">
          <h1 className="text-2xl font-black tracking-wide text-white">Sign in to my-POS</h1>
          <p className="mt-1.5 text-3xs font-semibold text-white/60">
            Enter your cashier or admin credentials to start your shift.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {errorMsg && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-3xs font-extrabold text-red-200 text-center uppercase tracking-wide">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="space-y-5">
            {/* Email Field (Transparent with Bottom Border) */}
            <div className="relative border-b border-white/30 focus-within:border-white py-1.5 transition-colors">
              <input
                id="email"
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-white/50 outline-none pr-8 py-1 font-semibold"
              />
              <Mail className="absolute right-1 top-3 h-4 w-4 text-white/60" />
            </div>

            {/* Password Field (Transparent with Bottom Border) */}
            <div className="relative border-b border-white/30 focus-within:border-white py-1.5 transition-colors">
              <input
                id="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-white/50 outline-none pr-8 py-1 font-semibold"
              />
              <Lock className="absolute right-1 top-3 h-4 w-4 text-white/60" />
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-center gap-2 text-4xs font-bold text-white/70 tracking-wide">
            <input 
              type="checkbox" 
              className="rounded border-white/40 bg-transparent text-purple-600 focus:ring-0 cursor-pointer h-3.5 w-3.5" 
              defaultChecked 
            />
            <span>I Agree to the Terms & Conditions</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-purple-950/80 hover:bg-purple-950 border border-white/10 py-3 text-center text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all disabled:opacity-50 active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Authorizing...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Operator Sign-in Details */}
        <div className="mt-8 rounded-2xl bg-white/5 p-5 text-3xs text-white/80 border border-white/5 leading-relaxed">
          <p className="font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
            🔑 Operator Sign-In Details:
          </p>
          <div className="mt-3.5 space-y-3">
            {/* Admin Box */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col gap-1">
              <span className="text-[10px] text-indigo-300 uppercase font-black tracking-widest">Admin Email</span>
              <code className="text-white font-mono text-xs select-all block mt-0.5 select-all">nikishkumaranr@gmail.com</code>
            </div>
            {/* Cashier Box */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex flex-col gap-1">
              <span className="text-[10px] text-indigo-300 uppercase font-black tracking-widest">Cashier Email</span>
              <code className="text-white font-mono text-xs select-all block mt-0.5 select-all">nikishkumaran5@gmail.com</code>
            </div>
            {/* Password Box */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex justify-between items-center">
              <span className="text-[10px] text-indigo-300 uppercase font-black tracking-widest">Password</span>
              <code className="text-white font-mono text-xs select-all bg-white/15 px-2.5 py-1 rounded select-all">Pos@123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
