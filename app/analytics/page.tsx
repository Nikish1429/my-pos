"use client";

import { useEffect, useState, useMemo } from "react";
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
  Filter,
  RefreshCw,
  MousePointerClick,
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

interface CustomerJoin {
  id: number;
  name: string;
  address: string;
}

interface UserJoin {
  name: string;
}

interface Sale {
  id: number;
  total_amount: number;
  sale_date: string;
  customer_id: number | null;
  user_id: number | null;
  customers: CustomerJoin | null;
  users: UserJoin | null;
}

interface ProductJoin {
  name: string;
  category: string;
}

interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  products: ProductJoin | null;
}

interface RawData {
  sales: Sale[];
  saleItems: SaleItem[];
}

const COLORS = ["#4f46e5", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

const getAreaFromAddress = (address: string | undefined): string => {
  if (!address) return "Walk-in";
  const areas = ["Adyar", "T. Nagar", "Velachery", "Mylapore", "Anna Nagar"];
  for (const area of areas) {
    if (address.toLowerCase().includes(area.toLowerCase())) {
      return area;
    }
  }
  return "Other";
};

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DROPDOWN FILTERS STATE ---
  const [timeRange, setTimeRange] = useState<string>("all"); // all, 1, 3, 7, 30, 90, 180

  // --- GRAPH GRAPH-CLICK (CROSS-FILTERING) STATE ---
  const [selectedRegion, setSelectedRegion] = useState<string>("All"); // filter by clicking Region/Place Bar
  const [selectedCategory, setSelectedCategory] = useState<string>("All"); // filter by clicking Category Pie
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // filter by clicking Timeline point
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null); // filter by clicking Product Bar
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null); // filter by clicking Customer table row

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (!res.ok) {
        throw new Error("Failed to load analytics data");
      }
      const jsonData = await res.json();
      setRawData(jsonData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  // Reset all filters (dropdowns and clicks)
  const resetFilters = () => {
    setTimeRange("all");
    setSelectedRegion("All");
    setSelectedCategory("All");
    setSelectedMonth(null);
    setSelectedProduct(null);
    setSelectedCustomer(null);
  };

  // --- INTERACTIVE FILTERING & AGGREGATION ENGINE ---
  const aggregatedData = useMemo(() => {
    if (!rawData) return null;

    const { sales, saleItems } = rawData;
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // 1. Filter Sales
    const filteredSales = sales.filter((sale) => {
      // Time Range Filter
      if (timeRange !== "all") {
        const saleDate = new Date(sale.sale_date);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - parseInt(timeRange));
        if (saleDate < cutoff) return false;
      }

      // Region/Place Filter (from Place Bar Chart click)
      const region = getAreaFromAddress(sale.customers?.address);
      if (selectedRegion !== "All" && region !== selectedRegion) return false;

      // Month Filter (from Line Chart point click)
      if (selectedMonth) {
        const date = new Date(sale.sale_date);
        const monthLabel = `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;
        if (monthLabel !== selectedMonth) return false;
      }

      // Customer Filter (from Leaderboard row click)
      if (selectedCustomer) {
        const custName = sale.customers
          ? `${sale.customers.name} (#${sale.customers.id})`
          : "Walk-in (Guest)";
        if (custName !== selectedCustomer) return false;
      }

      return true;
    });

    const filteredSaleIds = new Set(filteredSales.map((s) => s.id));

    // 2. Filter Sale Items
    const filteredSaleItems = saleItems.filter((item) => {
      // Must belong to one of the filtered sales
      if (!filteredSaleIds.has(item.sale_id)) return false;

      // Category Filter (from Category Pie Chart click)
      const category = item.products?.category || "Other";
      if (selectedCategory !== "All" && category !== selectedCategory) return false;

      // Product Filter (from Best-Sellers Bar Chart click)
      if (selectedProduct) {
        const prodName = item.products?.name || "Unknown Product";
        if (prodName !== selectedProduct) return false;
      }

      return true;
    });

    const activeSaleIdsWithItems = new Set(filteredSaleItems.map((item) => item.sale_id));

    // 3. Compute KPI Metrics (Revenue, Orders, AOV)
    let totalRevenue = 0;
    let totalOrders = 0;

    if (selectedCategory === "All" && !selectedProduct) {
      totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      totalOrders = filteredSales.length;
    } else {
      totalRevenue = filteredSaleItems.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
      totalOrders = activeSaleIdsWithItems.size;
    }
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 4. Group Revenue Over Time (Timeline Chart)
    const monthlyRevenueMap: { [key: string]: number } = {};
    
    if (selectedCategory === "All" && !selectedProduct) {
      filteredSales.forEach((s) => {
        const date = new Date(s.sale_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + Number(s.total_amount);
      });
    } else {
      filteredSaleItems.forEach((item) => {
        const sale = sales.find((s) => s.id === item.sale_id);
        if (sale) {
          const date = new Date(sale.sale_date);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + Number(item.quantity) * Number(item.unit_price);
        }
      });
    }

    const revenueOverTime = Object.keys(monthlyRevenueMap)
      .sort()
      .map((key) => {
        const [year, month] = key.split("-");
        const monthLabel = `${monthNames[parseInt(month) - 1]} ${year.slice(-2)}`;
        return {
          name: monthLabel,
          revenue: Number(monthlyRevenueMap[key].toFixed(2)),
        };
      });

    // 5. Group Revenue by Chennai Places (Bar Chart)
    const regionalRevenueMap: { [key: string]: number } = {};
    const regionsList = ["Adyar", "T. Nagar", "Velachery", "Mylapore", "Anna Nagar", "Walk-in"];
    regionsList.forEach((r) => (regionalRevenueMap[r] = 0));

    if (selectedCategory === "All" && !selectedProduct) {
      filteredSales.forEach((s) => {
        const region = getAreaFromAddress(s.customers?.address);
        if (regionsList.includes(region)) {
          regionalRevenueMap[region] = (regionalRevenueMap[region] || 0) + Number(s.total_amount);
        }
      });
    } else {
      filteredSaleItems.forEach((item) => {
        const sale = sales.find((s) => s.id === item.sale_id);
        if (sale) {
          const region = getAreaFromAddress(sale.customers?.address);
          if (regionsList.includes(region)) {
            regionalRevenueMap[region] = (regionalRevenueMap[region] || 0) + Number(item.quantity) * Number(item.unit_price);
          }
        }
      });
    }

    const revenueByRegion = Object.keys(regionalRevenueMap)
      .map((region) => ({
        region,
        revenue: Number(regionalRevenueMap[region].toFixed(2)),
      }))
      .filter((r) => r.revenue > 0 || selectedRegion === "All" || r.region === selectedRegion);

    // 6. Group Top Products by Quantity (Horizontal Bar Chart)
    const productQtyMap: { [key: string]: number } = {};
    filteredSaleItems.forEach((item) => {
      const prodName = item.products?.name || "Unknown Product";
      productQtyMap[prodName] = (productQtyMap[prodName] || 0) + Number(item.quantity);
    });

    const topProducts = Object.keys(productQtyMap)
      .map((name) => ({ name, quantity: productQtyMap[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 7. Group Sales by Category (Donut Chart)
    const categoryValueMap: { [key: string]: number } = {};
    filteredSaleItems.forEach((item) => {
      const category = item.products?.category || "Other";
      const value = Number(item.quantity) * Number(item.unit_price);
      categoryValueMap[category] = (categoryValueMap[category] || 0) + value;
    });

    const salesByCategory = Object.keys(categoryValueMap).map((category) => ({
      name: category,
      value: Number(categoryValueMap[category].toFixed(2)),
    }));

    // 8. Group Top Customers by Spending (Leaderboard)
    const customerSpendingMap: { [key: string]: number } = {};
    if (selectedCategory === "All" && !selectedProduct) {
      filteredSales.forEach((s) => {
        const custName = s.customers
          ? `${s.customers.name} (#${s.customers.id})`
          : "Walk-in (Guest)";
        customerSpendingMap[custName] = (customerSpendingMap[custName] || 0) + Number(s.total_amount);
      });
    } else {
      filteredSaleItems.forEach((item) => {
        const sale = sales.find((s) => s.id === item.sale_id);
        if (sale) {
          const custName = sale.customers
            ? `${sale.customers.name} (#${sale.customers.id})`
            : "Walk-in (Guest)";
          customerSpendingMap[custName] = (customerSpendingMap[custName] || 0) + Number(item.quantity) * Number(item.unit_price);
        }
      });
    }

    const topCustomers = Object.keys(customerSpendingMap)
      .map((name) => ({ name, spent: Number(customerSpendingMap[name].toFixed(2)) }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    return {
      kpis: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
      },
      revenueOverTime,
      revenueByRegion,
      topProducts,
      salesByCategory,
      topCustomers,
    };
  }, [rawData, timeRange, selectedRegion, selectedCategory, selectedMonth, selectedProduct, selectedCustomer]);

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

  if (error || !rawData || !aggregatedData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans p-4">
        <p className="text-sm text-red-600 font-bold">⚠️ Error: {error || "Failed to load dashboard data"}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, revenueOverTime, revenueByRegion, topProducts, salesByCategory, topCustomers } = aggregatedData;

  const hasActiveFilters =
    timeRange !== "all" ||
    selectedRegion !== "All" ||
    selectedCategory !== "All" ||
    selectedMonth !== null ||
    selectedProduct !== null ||
    selectedCustomer !== null;

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
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1 text-2xs font-extrabold uppercase text-zinc-500 hover:text-zinc-950 transition-all tracking-wider"
          >
            <RefreshCw className="h-3 w-3" /> Sync Data
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

        {/* INTERACTIVE FILTERS CONTROLS PANEL */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2 text-zinc-950">
              <Filter className="h-4 w-4 text-zinc-500" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider">Interactive Report Filters</h2>
            </div>
            <div className="flex items-center gap-1 text-3xs font-semibold text-zinc-400">
              <MousePointerClick className="h-3.5 w-3.5" />
              <span>Tip: Click on ANY chart element to filter!</span>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Filter 1: Time Range */}
            <div>
              <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
                Timeline Period
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500 text-zinc-900 font-semibold shadow-sm"
              >
                <option value="all">All Time (Last 6 Months)</option>
                <option value="1">Last 24 Hours (1 Day)</option>
                <option value="3">Last 3 Days</option>
                <option value="7">Last 7 Days (1 Week)</option>
                <option value="30">Last 30 Days (1 Month)</option>
                <option value="90">Last 90 Days (3 Months)</option>
                <option value="180">Last 180 Days (6 Months)</option>
              </select>
            </div>

            {/* Filter 2: Region / Place */}
            <div>
              <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
                Chennai Place
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500 text-zinc-900 font-semibold shadow-sm"
              >
                <option value="All">All Places</option>
                <option value="Adyar">Adyar</option>
                <option value="T. Nagar">T. Nagar</option>
                <option value="Velachery">Velachery</option>
                <option value="Mylapore">Mylapore</option>
                <option value="Anna Nagar">Anna Nagar</option>
                <option value="Walk-in">Walk-in Customers</option>
              </select>
            </div>

            {/* Filter 3: Category */}
            <div>
              <label className="block text-3xs font-extrabold uppercase tracking-wider text-zinc-400">
                Product Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500 text-zinc-900 font-semibold shadow-sm"
              >
                <option value="All">All Categories</option>
                <option value="Drinks">Drinks Only</option>
                <option value="Bakery">Bakery Only</option>
                <option value="Snacks">Snacks Only</option>
              </select>
            </div>
          </div>

          {/* Graphical Active Filters Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-50">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-3xs font-bold text-zinc-400 uppercase">Active Filters:</span>
                {timeRange !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-900 text-white px-2 py-0.5 text-3xs font-bold">
                    🕒 Range: Last {timeRange} Days <button onClick={() => setTimeRange("all")} className="hover:text-red-400">✕</button>
                  </span>
                )}
                {selectedMonth && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-900 text-white px-2 py-0.5 text-3xs font-bold">
                    📅 {selectedMonth} <button onClick={() => setSelectedMonth(null)} className="hover:text-red-400">✕</button>
                  </span>
                )}
                {selectedRegion !== "All" && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-900 text-white px-2 py-0.5 text-3xs font-bold">
                    📍 {selectedRegion} <button onClick={() => setSelectedRegion("All")} className="hover:text-red-400">✕</button>
                  </span>
                )}
                {selectedCategory !== "All" && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-900 text-white px-2 py-0.5 text-3xs font-bold">
                    🛍️ Category: {selectedCategory} <button onClick={() => setSelectedCategory("All")} className="hover:text-red-400">✕</button>
                  </span>
                )}
                {selectedProduct && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-900 text-white px-2 py-0.5 text-3xs font-bold">
                    ☕ Product: {selectedProduct} <button onClick={() => setSelectedProduct(null)} className="hover:text-red-400">✕</button>
                  </span>
                )}
                {selectedCustomer && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-900 text-white px-2 py-0.5 text-3xs font-bold">
                    👤 Customer: {selectedCustomer} <button onClick={() => setSelectedCustomer(null)} className="hover:text-red-400">✕</button>
                  </span>
                )}
              </div>
              <button
                onClick={resetFilters}
                className="text-3xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-all"
              >
                ✕ Clear All Filters
              </button>
            </div>
          )}
        </div>

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
          {/* Chart A: Revenue Over Time (Line with Click-Filtering) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-zinc-500" /> Revenue Over Time
              </div>
              {selectedMonth && (
                <span className="text-4xs font-extrabold bg-zinc-950 text-white rounded px-1.5 py-0.5 uppercase tracking-wide">
                  Filtered Month: {selectedMonth}
                </span>
              )}
            </h3>
            <div className="h-72 w-full">
              {revenueOverTime.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 font-medium">
                  No data matches active filters
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={revenueOverTime}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    style={{ cursor: "pointer" }}
                    onClick={(data: any) => {
                      const monthName = data?.activeLabel;
                      if (monthName) {
                        setSelectedMonth(selectedMonth === monthName ? null : monthName);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", borderRadius: "12px", border: "none", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const isSelected = selectedMonth === payload.name;
                        return (
                          <circle
                            key={payload.name}
                            cx={cx}
                            cy={cy}
                            r={isSelected ? 7 : 4}
                            fill={isSelected ? "#ec4899" : "#4f46e5"}
                            stroke="#fff"
                            strokeWidth={1.5}
                          />
                        );
                      }}
                      activeDot={{ r: 6 }}
                      name="Revenue (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart B: Revenue by Place (Bar with Cross-Filtering) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-500" /> Revenue by Place (Chennai)
              </div>
              {selectedRegion !== "All" && (
                <span className="text-4xs font-extrabold bg-zinc-950 text-white rounded px-1.5 py-0.5 uppercase tracking-wide">
                  Filtered: {selectedRegion}
                </span>
              )}
            </h3>
            <div className="h-72 w-full">
              {revenueByRegion.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 font-medium">
                  No data matches active filters
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByRegion} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="region" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", borderRadius: "12px", border: "none", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                      cursor={{ fill: "rgba(244, 244, 245, 0.5)" }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#71717a"
                      radius={[6, 6, 0, 0]}
                      name="Sales (₹)"
                      style={{ cursor: "pointer" }}
                      onClick={(data: any) => {
                        const region = data?.region || data?.payload?.region;
                        if (region) {
                          setSelectedRegion(selectedRegion === region ? "All" : region);
                        }
                      }}
                    >
                      {revenueByRegion.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={selectedRegion === "All" || selectedRegion === entry.region ? 1 : 0.45}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Product Recommendations & Category Splits */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Chart C: Top Products (Horizontal Bar with Cross-Filtering) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm md:col-span-2 flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Coffee className="h-4 w-4 text-zinc-500" /> Best-Selling Items
              </div>
              {selectedProduct && (
                <span className="text-4xs font-extrabold bg-zinc-950 text-white rounded px-1.5 py-0.5 uppercase tracking-wide">
                  Filtered Product: {selectedProduct}
                </span>
              )}
            </h3>
            <div className="h-64 w-full">
              {topProducts.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 font-medium">
                  No data matches active filters
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 10, left: 35, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                    <XAxis type="number" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", borderRadius: "12px", border: "none", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar
                      dataKey="quantity"
                      fill="#71717a"
                      radius={[0, 4, 4, 0]}
                      name="Qty Sold"
                      style={{ cursor: "pointer" }}
                      onClick={(data: any) => {
                        const name = data?.name || data?.payload?.name;
                        if (name) {
                          setSelectedProduct(selectedProduct === name ? null : name);
                        }
                      }}
                    >
                      {topProducts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={selectedProduct === null || selectedProduct === entry.name ? 1 : 0.45}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart D: Category Split (Donut/Pie with Cross-Filtering) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-zinc-500" /> Sales by Category
              </div>
              {selectedCategory !== "All" && (
                <span className="text-4xs font-extrabold bg-zinc-950 text-white rounded px-1.5 py-0.5 uppercase tracking-wide">
                  Filtered Category: {selectedCategory}
                </span>
              )}
            </h3>
            <div className="h-52 w-full relative">
              {salesByCategory.length === 0 ? (
                <div className="h-full w-full flex items-center justify-center text-xs text-zinc-400 font-medium">
                  No data matches active filters
                </div>
              ) : (
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
                      style={{ cursor: "pointer" }}
                      onClick={(data: any) => {
                        const name = data?.name || data?.payload?.name;
                        if (name) {
                          setSelectedCategory(selectedCategory === name ? "All" : name);
                        }
                      }}
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          opacity={selectedCategory === "All" || selectedCategory === entry.name ? 1 : 0.35}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#18181b", borderRadius: "12px", border: "none", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Pie Legend list */}
            {salesByCategory.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center text-3xs font-semibold text-zinc-600">
                {salesByCategory.map((entry, index) => (
                  <button
                    key={entry.name}
                    onClick={() => setSelectedCategory(selectedCategory === entry.name ? "All" : entry.name)}
                    className={`flex items-center gap-1.5 hover:text-zinc-950 transition-colors ${
                      selectedCategory !== "All" && selectedCategory !== entry.name ? "opacity-40" : ""
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[salesByCategory.indexOf(entry) % COLORS.length] }} />
                    <span className={selectedCategory === entry.name ? "underline font-extrabold text-zinc-900" : ""}>
                      {entry.name} ({kpis.totalRevenue > 0 ? ((entry.value / kpis.totalRevenue) * 100).toFixed(0) : 0}%)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Top Customers (Leaderboard list with Cross-Filtering) */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-zinc-500" /> Customer Leaderboard
            </div>
            {selectedCustomer && (
              <span className="text-4xs font-extrabold bg-zinc-950 text-white rounded px-1.5 py-0.5 uppercase tracking-wide">
                Filtered Customer: {selectedCustomer}
              </span>
            )}
          </h3>
          <div className="overflow-x-auto">
            {topCustomers.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400 font-medium">
                No customer transactions match active filters
              </div>
            ) : (
              <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4 text-right">Total Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                  {topCustomers.map((c, index) => {
                    const isSelected = selectedCustomer === c.name;
                    return (
                      <tr
                        key={index}
                        onClick={() => setSelectedCustomer(isSelected ? null : c.name)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? "bg-zinc-100 font-bold" : "hover:bg-zinc-50/50"
                        } ${selectedCustomer && !isSelected ? "opacity-40" : ""}`}
                      >
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
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
