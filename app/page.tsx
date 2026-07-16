"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import {
  ShoppingCart,
  History,
  Box,
  TrendingUp,
  Brain,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { user, role, userName, loading: authLoading, logout } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-zinc-50 to-zinc-100/50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tight text-zinc-950 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-indigo-600">
              my-POS
            </span>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500 font-semibold">
                Logged in as <b className="text-zinc-800">{userName || user.email}</b>
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-extrabold uppercase tracking-wide ${
                  role === "admin"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}
              >
                {role === "admin" ? "Admin" : "Cashier"}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Dashboard Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:py-12 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-70" />
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            Welcome to the POS Terminal, {userName || "User"}!
          </h1>
          <p className="mt-2 text-xs font-semibold text-zinc-500">
            Select a module below to start your shift. Your permissions are configured based on your role.
          </p>

          {/* Core Modules Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            
            {/* Checkout Terminal (Green Theme) */}
            <Link
              href="/billing"
              className="flex items-center gap-4 border border-emerald-100 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-md transition-all bg-gradient-to-br from-emerald-50/10 via-white to-white group active:scale-[0.99]"
            >
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-zinc-950 text-sm group-hover:text-emerald-800 transition-colors">Checkout Terminal</p>
                <p className="text-2xs text-zinc-500 mt-0.5 font-medium">Search products, click to add with beep sound, checkout.</p>
              </div>
            </Link>

            {/* Transaction Logs (Blue Theme) */}
            <Link
              href="/history"
              className="flex items-center gap-4 border border-blue-100 rounded-2xl p-5 hover:border-blue-400 hover:shadow-md transition-all bg-gradient-to-br from-blue-50/10 via-white to-white group active:scale-[0.99]"
            >
              <div className="rounded-xl bg-blue-50 p-3 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <History className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-zinc-950 text-sm group-hover:text-blue-800 transition-colors">Transaction Logs</p>
                <p className="text-2xs text-zinc-500 mt-0.5 font-medium">Browse past invoices, receipt lookups, details.</p>
              </div>
            </Link>

            {/* Inventory Manager (Purple Theme) */}
            {role === "admin" ? (
              <Link
                href="/inventory"
                className="flex items-center gap-4 border border-purple-100 rounded-2xl p-5 hover:border-purple-400 hover:shadow-md transition-all bg-gradient-to-br from-purple-50/10 via-white to-white group active:scale-[0.99]"
              >
                <div className="rounded-xl bg-purple-50 p-3 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                  <Box className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-zinc-950 text-sm group-hover:text-purple-800 transition-colors">Inventory Manager</p>
                  <p className="text-2xs text-zinc-500 mt-0.5 font-medium">Control pricing, stock quantities, barcode catalog.</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-4 border border-zinc-200/60 rounded-2xl p-5 bg-zinc-100/50">
                <div className="rounded-xl bg-zinc-200 p-3 text-zinc-400">
                  <Box className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-zinc-400 text-sm">Inventory Manager</p>
                  <p className="text-2xs text-zinc-400 mt-0.5 font-medium">Sign in as an administrator to unlock.</p>
                </div>
              </div>
            )}

            {/* Store Analytics (Amber Theme) */}
            <Link
              href="/analytics"
              className="flex items-center gap-4 border border-amber-100 rounded-2xl p-5 hover:border-amber-400 hover:shadow-md transition-all bg-gradient-to-br from-amber-50/10 via-white to-white group active:scale-[0.99]"
            >
              <div className="rounded-xl bg-amber-50 p-3 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-zinc-950 text-sm group-hover:text-amber-800 transition-colors">Store Analytics</p>
                <p className="text-2xs text-zinc-500 mt-0.5 font-medium">Visualize sales trends, best sellers, neighborhood charts.</p>
              </div>
            </Link>
          </div>
        </div>

        <Link
          href="/ai-manager"
          className="block bg-gradient-to-br from-zinc-950 via-indigo-950 to-purple-950 border border-indigo-500/30 rounded-3xl p-9 shadow-xl hover:border-indigo-400 hover:shadow-2xl transition-all group active:scale-[0.99] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-2.5 text-amber-300">
              <Brain className="h-6 w-6 text-indigo-300 group-hover:animate-bounce" /> my-POS Intelligence Engine
            </h2>
            <span className="flex items-center gap-1 text-2xs font-extrabold uppercase text-amber-400 group-hover:text-amber-300 transition-colors">
              <Sparkles className="h-3.5 w-3.5 fill-amber-400" /> Start Engine →
            </span>
          </div>
          <div className="mt-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
            <p className="max-w-md text-sm text-zinc-100/90 leading-relaxed font-semibold">
              Launch our Next-Gen AI store cockpit. Ask natural-language queries about monthly earnings, access weekly product demand forecasting, flag anomaly transactions, and see smart stock alerts.
            </p>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-2xs text-zinc-100/90 w-full md:w-64 space-y-1.5 shadow-inner">
              <p className="font-extrabold uppercase tracking-wider text-amber-300 mb-2">⚡ Engine Capabilities</p>
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> NLP Store Chatbot</div>
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Demand Forecasts</div>
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Anomaly Auditor</div>
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Smart Restock Alerts</div>
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
}
