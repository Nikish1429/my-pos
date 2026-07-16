"use client";

import React, { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

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
      
      // AuthProvider's listener will handle redirecting to "/"
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-50 px-6 py-12 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Sign in to my-POS</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Enter your credentials below to access the terminal.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          {errorMsg && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="cashier@mypos.com or admin@mypos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Password
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:bg-white transition-all text-zinc-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-zinc-900 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 rounded-lg bg-zinc-50 p-4 text-xs text-zinc-500 border border-zinc-100">
          <p className="font-semibold text-zinc-700">Demo accounts info:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Admin: <code className="bg-zinc-200 px-1 rounded">alice@mypos.com</code></li>
            <li>Cashier: <code className="bg-zinc-200 px-1 rounded">charlie@mypos.com</code></li>
            <li>Password setup: Set these users in Supabase Auth Dashboard to log in.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
