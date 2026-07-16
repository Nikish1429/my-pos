"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  ArrowLeft,
  Loader2,
  MapPin,
  Coffee,
  PieChart as PieIcon,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface KPI {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

interface ChartData {
  kpis: KPI;
  revenueOverTime: { name: string; revenue: number }[];
  revenueByRegion: { region: string; revenue: number }[];
  topProducts: { name: string; quantity: number }[];
  salesByCategory: { name: string; value: number }[];
  topCustomers: { name: string; spent: number }[];
}

const COLORS = ["#18181b", "#71717a", "#d4d4d8", "#e4e4e7", "#f4f4f5"];

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchAnalytics = async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/analytics");
          if (!res.ok) {
            throw new Error("Failed to load analytics data");
          }
          const jsonData = await res.json();
          setData(jsonData);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAnalytics();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-950" />
        <p className="mt-2.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
          Aggregating store performance metrics...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans p-4">
        <p className="text-sm text-red-600 font-bold">⚠️ Error: {error || "Failed to load dashboard data"}</p>
        <Link
          href="/"
          className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Go back Dashboard
        </Link>
      </div>
    );
  }

  const { kpis, revenueOverTime, revenueByRegion, topProducts, salesByCategory, topCustomers } = data;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 transition-all active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-lg font-extrabold tracking-tight text-zinc-950">Store Analytics Dashboard</span>
          </div>
          <span className="rounded bg-zinc-100 px-2 py-0.5 text-2xs font-extrabold uppercase text-zinc-600 tracking-wider">
            Live Feed
          </span>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Row 1: KPI Widgets */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Revenue */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl bg-zinc-900 text-white p-3.5">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-zinc-400">Total Revenue</p>
              <p className="text-2xl font-extrabold text-zinc-950 mt-0.5">
                ₹{kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Card 2: Orders Count */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl bg-zinc-100 text-zinc-900 p-3.5">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-zinc-400">Total Orders</p>
              <p className="text-2xl font-extrabold text-zinc-950 mt-0.5">
                {kpis.totalOrders.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Card 3: AOV */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="rounded-xl bg-zinc-100 text-zinc-900 p-3.5">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xs font-bold uppercase tracking-wider text-zinc-400">Average Order Value</p>
              <p className="text-2xl font-extrabold text-zinc-950 mt-0.5">
                ₹{kpis.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Row 2: Sales Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Chart A: Revenue Over Time (Line) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <TrendingUp className="h-4 w-4 text-zinc-500" /> Revenue Over Time
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", borderRadius: "12px", border: "none", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#000000" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Revenue (₹)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart B: Revenue by Region (Bar) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <MapPin className="h-4 w-4 text-zinc-500" /> Revenue by Region
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByRegion} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="region" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", borderRadius: "12px", border: "none", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="revenue" fill="#18181b" radius={[6, 6, 0, 0]} name="Sales (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Product Recommendations & Category Splits */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Chart C: Top Products (Horizontal Bar) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm md:col-span-2 flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <Coffee className="h-4 w-4 text-zinc-500" /> Best-Selling Items
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 10, left: 35, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                  <XAxis type="number" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={100} />
                  <Tooltip
                    contentStyle={{ background: "#18181b", borderRadius: "12px", border: "none", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="quantity" fill="#18181b" radius={[0, 4, 4, 0]} name="Qty Sold" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart D: Category Split (Donut/Pie) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
              <PieIcon className="h-4 w-4 text-zinc-500" /> Sales by Category
            </h3>
            <div className="h-52 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#18181b", borderRadius: "12px", border: "none", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Pie Legend list */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center text-3xs font-semibold text-zinc-600">
              {salesByCategory.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span>{entry.name} ({((entry.value / kpis.totalRevenue) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Top Customers (Leaderboard list) */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3 mb-4">
            <Award className="h-4 w-4 text-zinc-500" /> Customer Leaderboard
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
              <thead>
                <tr className="text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4 text-right">Total Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                {topCustomers.map((c, index) => (
                  <tr key={index} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900">#{index + 1}</td>
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-extrabold text-3xs border border-zinc-200 uppercase">
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-zinc-950">
                      ₹{c.spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
