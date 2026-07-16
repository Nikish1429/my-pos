"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
};

export default function Home() {
  const { user, role, userName, loading: authLoading, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchProducts = async () => {
        try {
          setLoadingProducts(true);
          const res = await fetch("/api/products");
          if (!res.ok) {
            throw new Error("Could not fetch products");
          }
          const data = await res.json();
          setProducts(data.slice(0, 5)); // Just show a few sample products
        } catch (err: any) {
          setProductsError(err.message);
        } finally {
          setLoadingProducts(false);
        }
      };

      fetchProducts();
    }
  }, [user]);

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
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-zinc-950 text-sm">Checkout Terminal</p>
                <p className="text-2xs text-zinc-500 mt-0.5">Search products, manage carts, complete sales.</p>
              </div>
            </Link>

            <Link
              href="/history"
              className="flex items-center gap-4 border border-zinc-200 rounded-xl p-5 hover:border-zinc-500 hover:shadow-md transition-all bg-white group active:scale-[0.99]"
            >
              <div className="rounded-lg bg-zinc-100 p-3 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-zinc-950 text-sm">Transaction Logs</p>
                <p className="text-2xs text-zinc-500 mt-0.5">Browse past invoices, receipt lookups, details.</p>
              </div>
            </Link>

            {role === "admin" ? (
              <Link
                href="/inventory"
                className="flex items-center gap-4 border border-zinc-200 rounded-xl p-5 hover:border-zinc-500 hover:shadow-md transition-all bg-white group active:scale-[0.99] sm:col-span-2"
              >
                <div className="rounded-lg bg-zinc-100 p-3 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-zinc-950 text-sm">Inventory Manager (Admin Only)</p>
                  <p className="text-2xs text-zinc-500 mt-0.5">Control pricing, stock quantities, add/edit products catalog.</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-4 border border-zinc-200/60 rounded-xl p-5 bg-zinc-100/50 sm:col-span-2">
                <div className="rounded-lg bg-zinc-200 p-3 text-zinc-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-zinc-400 text-sm">Inventory Manager (Admin Only)</p>
                  <p className="text-2xs text-zinc-400 mt-0.5">Sign in as an administrator to unlock product catalog management controls.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database Quick Healthcheck Panel */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-950 tracking-wide uppercase border-b border-zinc-100 pb-3">
            Database Status & Sample Catalog
          </h2>

          <div className="mt-4">
            {loadingProducts ? (
              <div className="flex h-12 items-center justify-center">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
              </div>
            ) : productsError ? (
              <p className="text-xs text-red-600">⚠️ Error loading catalog: {productsError}</p>
            ) : (
              <div>
                <p className="text-2xs text-zinc-500 mb-2">Connected. Here are some catalog samples:</p>
                <div className="flex flex-wrap gap-2">
                  {products.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2.5 py-1 text-2xs font-semibold text-zinc-800 border border-zinc-200"
                    >
                      {p.name} (₹{Number(p.price).toFixed(2)})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
