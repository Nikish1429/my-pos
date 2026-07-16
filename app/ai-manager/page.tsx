"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft,
  Brain,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Zap,
  Loader2,
  Send,
  Sparkles,
  Search,
} from "lucide-react";

interface CustomerJoin {
  name: string;
}

interface Sale {
  id: number;
  total_amount: number;
  sale_date: string;
  customer_id: number | null;
  customers: CustomerJoin | null;
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

export default function AIManagerPage() {
  const { user, loading: authLoading } = useAuth();
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat Assistant state
  const [query, setQuery] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "Hello! I am your AI Store Manager Assistant. You can ask me natural language queries about your sales history like:\n- 'Which product sold the most this month?'\n- 'Show total revenue in June'\n- 'What is our best selling category?'\n- 'Show our top customer'",
    },
  ]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to load store metrics");
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

  // --- AI ENGINES (FORECASTING, ANOMALIES, INVENTORY) ---
  const aiInsights = useMemo(() => {
    if (!rawData) return null;
    const { sales, saleItems } = rawData;

    // 1. Demand Forecasting (Predict next week's sales per product based on daily averages)
    const productSalesHistory: { [key: string]: { qty: number; daysWithSales: Set<string> } } = {};
    saleItems.forEach((item) => {
      const prodName = item.products?.name || "Unknown Product";
      const sale = sales.find((s) => s.id === item.sale_id);
      if (!sale) return;

      const dateStr = new Date(sale.sale_date).toDateString();
      if (!productSalesHistory[prodName]) {
        productSalesHistory[prodName] = { qty: 0, daysWithSales: new Set() };
      }
      productSalesHistory[prodName].qty += item.quantity;
      productSalesHistory[prodName].daysWithSales.add(dateStr);
    });

    const forecasting = Object.keys(productSalesHistory).map((name) => {
      const history = productSalesHistory[name];
      const avgDailyQty = history.qty / 180; // normalized over 6 months
      const nextWeekForecast = Math.round(avgDailyQty * 7);

      // Low stock warning (if next week's forecast is higher than hypothetical safety stock threshold)
      const stockLevel = name.includes("Coffee") || name.includes("Chai") ? 150 : 50; // Mock current stock levels for preview
      const isLowStockWarning = nextWeekForecast > (stockLevel * 0.8);

      return {
        name,
        avgDailyQty: avgDailyQty.toFixed(1),
        nextWeekForecast,
        isLowStockWarning,
      };
    }).sort((a, b) => b.nextWeekForecast - a.nextWeekForecast);

    // 2. Anomaly Detection (Detect bulk purchases or sudden volume spikes)
    const anomalies = sales
      .filter((s) => Number(s.total_amount) > 1000) // Flag transactions over ₹1,000 as large size anomalies
      .map((s) => ({
        id: s.id,
        total: Number(s.total_amount).toFixed(2),
        date: new Date(s.sale_date).toLocaleDateString(),
        customer: s.customers?.name || "Walk-in Guest",
        reason: Number(s.total_amount) > 2000 ? "Suspicious High Transaction (> ₹2,000)" : "Unusual Bulk Order Size",
      }))
      .slice(0, 5);

    // 3. Smart Inventory Alerts
    const fastMoving = forecasting.slice(0, 5);
    const slowMoving = [...forecasting].reverse().slice(0, 5);

    return {
      forecasting,
      anomalies,
      fastMoving,
      slowMoving,
    };
  }, [rawData]);

  // --- AI CHAT NLP PROCESSOR ---
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !rawData) return;

    const userMsg = query.trim();
    setQuery("");
    setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);

    // Simulated NLP Processor
    let reply = "I'm sorry, I couldn't compute that answer. Try asking for: 'most sold product this month', 'revenue in June', or 'top customer'.";
    const normalized = userMsg.toLowerCase();

    const { sales, saleItems } = rawData;

    if (normalized.includes("product") && (normalized.includes("most") || normalized.includes("best") || normalized.includes("sold"))) {
      // Find top selling product
      const productQtyMap: { [key: string]: number } = {};
      saleItems.forEach((item) => {
        const prodName = item.products?.name || "Unknown Product";
        productQtyMap[prodName] = (productQtyMap[prodName] || 0) + item.quantity;
      });
      const sorted = Object.keys(productQtyMap).sort((a, b) => productQtyMap[b] - productQtyMap[a]);
      if (sorted.length > 0) {
        reply = `☕ The best-selling product overall is **${sorted[0]}** with a total of **${productQtyMap[sorted[0]]} units** sold.`;
      }
    } else if (normalized.includes("revenue") || normalized.includes("sales")) {
      const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
      
      let matchedMonthIndex = -1;
      monthNames.forEach((m, idx) => {
        if (normalized.includes(m) || normalized.includes(shortMonths[idx])) {
          matchedMonthIndex = idx;
        }
      });

      if (matchedMonthIndex !== -1) {
        const targetMonthName = monthNames[matchedMonthIndex];
        const monthlyTotal = sales
          .filter((s) => new Date(s.sale_date).getMonth() === matchedMonthIndex)
          .reduce((sum, s) => sum + Number(s.total_amount), 0);

        reply = `📊 Total revenue for **${targetMonthName.toUpperCase()}** is **₹${monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}** over ${sales.filter((s) => new Date(s.sale_date).getMonth() === matchedMonthIndex).length} orders.`;
      } else {
        const total = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        reply = `📈 Our overall total revenue recorded across all databases is **₹${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}**.`;
      }
    } else if (normalized.includes("customer")) {
      const customerSpendingMap: { [key: string]: number } = {};
      sales.forEach((s) => {
        const custName = s.customers?.name || "Walk-in Guest";
        if (custName !== "Walk-in Guest") {
          customerSpendingMap[custName] = (customerSpendingMap[custName] || 0) + Number(s.total_amount);
        }
      });
      const sortedCust = Object.keys(customerSpendingMap).sort((a, b) => customerSpendingMap[b] - customerSpendingMap[a]);
      if (sortedCust.length > 0) {
        reply = `👤 Our highest spending loyalty member is **${sortedCust[0]}**, having spent a total of **₹${customerSpendingMap[sortedCust[0]].toLocaleString(undefined, { minimumFractionDigits: 2 })}** at our terminal.`;
      } else {
        reply = "No registered loyalty members found in our current sales logs.";
      }
    } else if (normalized.includes("category")) {
      const catRevenueMap: { [key: string]: number } = {};
      saleItems.forEach((item) => {
        const catName = item.products?.category || "Other";
        catRevenueMap[catName] = (catRevenueMap[catName] || 0) + (item.quantity * item.unit_price);
      });
      const sortedCat = Object.keys(catRevenueMap).sort((a, b) => catRevenueMap[b] - catRevenueMap[a]);
      if (sortedCat.length > 0) {
        reply = `🛍️ The highest revenue generating product category is **${sortedCat[0]}**, contributing **₹${catRevenueMap[sortedCat[0]].toLocaleString(undefined, { minimumFractionDigits: 2 })}** to our store.`;
      }
    }

    setTimeout(() => {
      setChatLog((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 400);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-950" />
        <p className="mt-2.5 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
          Connecting AI Store Manager models...
        </p>
      </div>
    );
  }

  if (error || !rawData || !aiInsights) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans p-4">
        <p className="text-sm text-red-600 font-bold">⚠️ Error: {error || "Failed to load dashboard data"}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

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
            <span className="text-lg font-extrabold tracking-tight text-zinc-950">AI Store Manager Dashboard</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1 text-4xs font-black uppercase text-white tracking-widest">
            <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" /> AI Co-Pilot Active
          </span>
        </div>
      </nav>

      {/* Main layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: AI Forecast, Anomalies, Stock Alerts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Demand Forecasting & stockout alerts */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-800" /> Product Demand Forecasting & Safety Stock
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-2xs divide-y divide-zinc-200 font-medium">
                <thead>
                  <tr className="text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-right">Avg Daily Qty</th>
                    <th className="py-2.5 px-3 text-right">Next Week Forecast</th>
                    <th className="py-2.5 px-3 text-right">Stock Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {aiInsights.forecasting.slice(0, 5).map((f, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-3 font-semibold text-zinc-950">{f.name}</td>
                      <td className="py-3 px-3 text-right text-zinc-500">{f.avgDailyQty} units</td>
                      <td className="py-3 px-3 text-right font-extrabold text-zinc-900">{f.nextWeekForecast} units</td>
                      <td className="py-3 px-3 text-right">
                        {f.isLowStockWarning ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-4xs font-black text-amber-700 uppercase">
                            <AlertTriangle className="h-2.5 w-2.5" /> High Stockout Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-4xs font-bold text-zinc-600 uppercase">
                            Stable Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Anomaly Detection List */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-zinc-800" /> Real-time Anomaly & Suspicious Activity Logs
            </h2>
            <div className="mt-4 space-y-3">
              {aiInsights.anomalies.map((a, idx) => (
                <div key={idx} className="flex justify-between items-start border border-zinc-200 rounded-xl p-3.5 bg-zinc-50/50 hover:bg-zinc-50 transition-all">
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-zinc-950">Receipt ID: #{a.id}</p>
                    <p className="text-3xs text-zinc-500 font-semibold uppercase">Customer: {a.customer} • Date: {a.date}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-black text-xs text-zinc-900">₹{a.total}</p>
                    <span className="inline-block text-4xs font-black uppercase text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                      {a.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Smart Inventory Alerts (Reorder Suggestion) */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Fast Moving */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-2xs font-extrabold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2 mb-3.5 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-zinc-800" /> Fast-Moving Products
              </h3>
              <ul className="space-y-2">
                {aiInsights.fastMoving.map((p, idx) => (
                  <li key={idx} className="flex justify-between items-center text-xs font-semibold text-zinc-800">
                    <span>{p.name}</span>
                    <span className="text-2xs text-zinc-500 font-bold bg-zinc-100 px-2 py-0.5 rounded-full">{p.nextWeekForecast} sold / wk</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Slow Moving */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-2xs font-extrabold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-2 mb-3.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-zinc-400" /> Slow-Moving Products
              </h3>
              <ul className="space-y-2">
                {aiInsights.slowMoving.map((p, idx) => (
                  <li key={idx} className="flex justify-between items-center text-xs font-semibold text-zinc-800">
                    <span>{p.name}</span>
                    <span className="text-3xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">Reorder Suggested</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Right 1 Column: AI Chat Assistant */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col h-[calc(100vh-140px)]">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-zinc-800" /> AI Natural Language Assistant
          </h2>

          {/* Chat log messages area */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 text-2xs leading-relaxed">
            {chatLog.map((log, idx) => (
              <div
                key={idx}
                className={`flex flex-col rounded-2xl p-3.5 shadow-sm max-w-[90%] ${
                  log.role === "user"
                    ? "bg-zinc-900 text-white self-end ml-auto"
                    : "bg-zinc-100 text-zinc-800 self-start mr-auto border border-zinc-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{log.text}</p>
              </div>
            ))}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleChatSubmit} className="mt-4 pt-3 border-t border-zinc-100 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask AI, e.g. 'Show revenue in June'"
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-2xs outline-none focus:border-zinc-500 focus:bg-white text-zinc-900 font-semibold"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 transition-all active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
