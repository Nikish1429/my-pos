"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useEffect, useState } from "react";
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
    <div className="flex-1 bg-zinc-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-zinc-900">my-POS</span>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500">
                Logged in as <b className="text-zinc-800">{userName || user.email}</b>
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold ${
                  role === "admin"
                    ? "bg-green-100 text-green-900"
                    : "bg-blue-100 text-blue-900"
                }`}
              >
                {role === "admin" ? "Admin" : "Cashier"}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Dashboard Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:py-12 space-y-8">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">
            Welcome to the POS Terminal, {userName || "User"}!
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Select a module below to start your shift. Your permissions are configured based on your role.
          </p>

          {/* Core Modules Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/billing"
              className="flex items-center gap-4 border border-zinc-200 rounded-xl p-5 hover:border-zinc-500 hover:shadow-md transition-all bg-white group active:scale-[0.99]"
            >
              <div className="rounded-lg bg-zinc-100 p-3 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-zinc-950 text-sm">Checkout Terminal</p>
                <p className="text-2xs text-zinc-500 mt-0.5">Search products, scan barcodes, checkout sales.</p>
              </div>
            </Link>

            <Link
              href="/history"
              className="flex items-center gap-4 border border-zinc-200 rounded-xl p-5 hover:border-zinc-500 hover:shadow-md transition-all bg-white group active:scale-[0.99]"
            >
              <div className="rounded-lg bg-zinc-100 p-3 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <History className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-zinc-950 text-sm">Transaction Logs</p>
                <p className="text-2xs text-zinc-500 mt-0.5">Browse past invoices, receipt lookups, details.</p>
              </div>
            </Link>

            {role === "admin" ? (
              <Link
                href="/inventory"
                className="flex items-center gap-4 border border-zinc-200 rounded-xl p-5 hover:border-zinc-500 hover:shadow-md transition-all bg-white group active:scale-[0.99]"
              >
                <div className="rounded-lg bg-zinc-100 p-3 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <Box className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-zinc-950 text-sm">Inventory Manager (Admin Only)</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">Control pricing, stock quantities, catalog.</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-4 border border-zinc-200/60 rounded-xl p-5 bg-zinc-100/50">
                <div className="rounded-lg bg-zinc-200 p-3 text-zinc-400">
                  <Box className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-zinc-400 text-sm">Inventory Manager (Admin Only)</p>
                  <p className="text-2xs text-zinc-400 mt-0.5">Sign in as an administrator to unlock.</p>
                </div>
              </div>
            )}

            <Link
              href="/analytics"
              className="flex items-center gap-4 border border-zinc-200 rounded-xl p-5 hover:border-zinc-500 hover:shadow-md transition-all bg-white group active:scale-[0.99]"
            >
              <div className="rounded-lg bg-zinc-100 p-3 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-zinc-950 text-sm">Store Analytics</p>
                <p className="text-2xs text-zinc-500 mt-0.5">Visualize sales trends, best sellers, regional charts.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* AI Sales Forecast Card -> Replaced with link to AI Assistant & Forecaster Page */}
        <Link
          href="/ai-manager"
          className="block bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:border-zinc-500 hover:shadow-md transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-xs font-extrabold text-zinc-950 tracking-wider uppercase flex items-center gap-2">
              <Brain className="h-4.5 w-4.5 text-zinc-800 group-hover:animate-bounce" /> AI Store Assistant & forecasting
            </h2>
            <span className="flex items-center gap-1 text-3xs font-extrabold uppercase text-amber-500 group-hover:text-amber-600 transition-colors">
              <Sparkles className="h-3 w-3 fill-amber-500" /> Co-Pilot Page →
            </span>
          </div>
          <div className="mt-4 flex flex-col md:flex-row justify-between items-start gap-4 text-xs font-semibold text-zinc-600">
            <p className="max-w-md leading-relaxed">
              Launch our Next-Gen AI store cockpit. Ask natural-language queries about monthly earnings, access weekly product demand forecasting, flag anomaly transactions, and see smart stock alerts.
            </p>
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-2 text-2xs text-zinc-500 max-w-[200px] leading-snug">
              📊 <b>Enabled Tools:</b> NLP Assistant, stockout predictions, anomaly logs, reorder recommendations.
            </div>
          </div>
        </Link>
      </main>
    </div>
  );
}
