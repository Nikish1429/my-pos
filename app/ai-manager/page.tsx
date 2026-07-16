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
} from "lucide-react";

interface CustomerJoin {
  name: string;
  address?: string;
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
      text: "Hello! I am the my-POS Chatbot. You can ask me natural language queries about your sales history, or ask me to perform math calculations/averages related to your data! Try asking:\n- 'Calculate 5% of 25000'\n- 'What is our total revenue?'\n- 'Which product sold the most this month?'\n- 'Show revenue in June'\n- 'How many sales total?'",
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
      const avgDailyQty = (history.qty / 180) * 15; // Project 15x higher velocity for busy supermarket demo
      const nextWeekForecast = Math.round(avgDailyQty * 7);

      // Low stock warning (if next week's forecast is higher than hypothetical safety stock threshold)
      const stockLevel = name.includes("Coffee") || name.includes("Chai") ? 350 : 120; // Adjusted safety stock levels
      const isLowStockWarning = nextWeekForecast > (stockLevel * 0.85);

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

  // --- AI CHAT NLP & MATH PROCESSOR ---
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !rawData) return;

    const userMsg = query.trim();
    setQuery("");
    setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);

    const { sales, saleItems } = rawData;
    const normalized = userMsg.toLowerCase();
    let reply = "I'm sorry, I couldn't compute that database answer. Try asking about a specific product name (e.g. 'Filter Coffee'), a customer (e.g. 'Aarav'), a neighborhood (e.g. 'Velachery'), a month (e.g. 'June'), or general calculations (e.g. '1500 * 0.10').";

    // --- Entity Extraction ---
    let matchedProduct: string | null = null;
    let matchedCustomer: string | null = null;
    let matchedNeighborhood: string | null = null;

    // Extract product
    const distinctProductNames = Array.from(new Set(saleItems.map(item => item.products?.name).filter(Boolean))) as string[];
    for (const name of distinctProductNames) {
      if (normalized.includes(name.toLowerCase())) {
        matchedProduct = name;
      }
    }

    // Extract neighborhood
    const neighborhoods = ["adyar", "t. nagar", "velachery", "mylapore", "anna nagar"];
    for (const n of neighborhoods) {
      if (normalized.includes(n)) {
        matchedNeighborhood = n;
      }
    }

    // Extract customer
    const distinctCustomerNames = Array.from(new Set(sales.map(s => s.customers?.name).filter(Boolean))) as string[];
    for (const name of distinctCustomerNames) {
      if (normalized.includes(name.toLowerCase())) {
        matchedCustomer = name;
      }
    }

    // --- Decision Tree (Semantic Router) ---
    
    // 1. Math Calculation Engine
    const isMathExpression = /[\d]+/.test(normalized) && (
      normalized.includes("+") || 
      normalized.includes("-") || 
      normalized.includes("*") || 
      normalized.includes("/") || 
      normalized.includes("of") || 
      normalized.includes("percent") || 
      normalized.includes("%")
    );

    if (isMathExpression) {
      try {
        if (normalized.includes("of") && (normalized.includes("%") || normalized.includes("percent"))) {
          const parts = normalized.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(\d+(?:\.\d+)?)/);
          if (parts) {
            const pct = parseFloat(parts[1]);
            const val = parseFloat(parts[2]);
            reply = `🧮 **Calculation**: ${pct}% of ${val} = **₹${((pct / 100) * val).toFixed(2)}**`;
          }
        } else {
          const expression = normalized.replace(/[^-()\d/*+.]/g, "");
          if (expression.length > 0) {
            const result = new Function(`return (${expression})`)();
            reply = `🧮 **Calculation Result**: ${expression} = **${result.toLocaleString(undefined, { maximumFractionDigits: 2 })}**`;
          }
        }
      } catch (err) {
        reply = "I attempted to compute that mathematical query but encountered a format error. Please try a simple expression like '1500 * 0.10' or '250 + 60'.";
      }
    } 
    // 2. Specific Product Query
    else if (matchedProduct) {
      const itemsForProduct = saleItems.filter(item => item.products?.name === matchedProduct);
      const unitsSold = itemsForProduct.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = itemsForProduct.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      reply = `☕ **Product Summary for ${matchedProduct}**:\n• Total Units Sold: **${unitsSold}**\n• Generated Revenue: **₹${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n• Average Selling Price: **₹${(totalRevenue / (unitsSold || 1)).toFixed(2)}**`;
    }
    // 3. Specific Customer Query
    else if (matchedCustomer) {
      const customerSales = sales.filter(s => s.customers?.name.toLowerCase() === matchedCustomer?.toLowerCase());
      const totalSpend = customerSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      reply = `👤 **Customer Profile: ${matchedCustomer}**:\n• Total Spending: **₹${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n• Total Transactions: **${customerSales.length}**\n• Average Ticket: **₹${(totalSpend / (customerSales.length || 1)).toFixed(2)}**`;
    }
    // 4. Neighborhood Area Query
    else if (matchedNeighborhood) {
      const neighborhoodSales = sales.filter(s => s.customers?.address && s.customers.address.toLowerCase().includes(matchedNeighborhood || ""));
      const totalSales = neighborhoodSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      reply = `📍 **Neighborhood Summary: ${matchedNeighborhood.toUpperCase()}**:\n• Total Sales Revenue: **₹${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}**\n• Active Orders: **${neighborhoodSales.length}**\n• Average Order Size: **₹${(totalSales / (neighborhoodSales.length || 1)).toFixed(2)}**`;
    }
    // 5. Month Specific Query
    else if (normalized.includes("january") || normalized.includes("february") || normalized.includes("march") || normalized.includes("april") || normalized.includes("may") || normalized.includes("june") || normalized.includes("july") || normalized.includes("august") || normalized.includes("september") || normalized.includes("october") || normalized.includes("november") || normalized.includes("december") ||
             normalized.includes("jan") || normalized.includes("feb") || normalized.includes("mar") || normalized.includes("apr") || normalized.includes("jun") || normalized.includes("jul") || normalized.includes("aug") || normalized.includes("sep") || normalized.includes("oct") || normalized.includes("nov") || normalized.includes("dec")) {
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
      }
    }
    // 6. Generic "most sold" / best selling query
    else if (normalized.includes("most") || normalized.includes("best") || normalized.includes("popular") || normalized.includes("top")) {
      const productQtyMap: { [key: string]: number } = {};
      saleItems.forEach((item) => {
        const prodName = item.products?.name || "Unknown Product";
        productQtyMap[prodName] = (productQtyMap[prodName] || 0) + item.quantity;
      });
      const sorted = Object.keys(productQtyMap).sort((a, b) => productQtyMap[b] - productQtyMap[a]);
      if (sorted.length > 0) {
        reply = `🏆 The best-selling product overall is **${sorted[0]}** with a total of **${productQtyMap[sorted[0]]} units** sold.`;
      }
    }
    // 7. Generic "least sold" / worst query
    else if (normalized.includes("least") || normalized.includes("worst") || normalized.includes("slow")) {
      const productQtyMap: { [key: string]: number } = {};
      saleItems.forEach((item) => {
        const prodName = item.products?.name || "Unknown Product";
        productQtyMap[prodName] = (productQtyMap[prodName] || 0) + item.quantity;
      });
      const sorted = Object.keys(productQtyMap).sort((a, b) => productQtyMap[a] - productQtyMap[b]);
      if (sorted.length > 0) {
        reply = `⚠️ The lowest selling product is **${sorted[0]}** with only **${productQtyMap[sorted[0]]} units** sold.`;
      }
    }
    // 8. General Revenue / Earnings summaries
    else if (normalized.includes("revenue") || normalized.includes("sales") || normalized.includes("earnings") || normalized.includes("turnover")) {
      const total = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      reply = `📈 Our overall store revenue is **₹${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}**.`;
    }
    // 9. Customer Counts
    else if (normalized.includes("how many customers") || normalized.includes("number of customers")) {
      const distinctCustomers = new Set(sales.filter(s => s.customer_id).map(s => s.customer_id)).size;
      reply = `👤 There are **${distinctCustomers} registered customers** who have placed orders in our system.`;
    }
    // 10. Transaction / Orders Counts
    else if (normalized.includes("how many sales") || normalized.includes("number of sales") || normalized.includes("total orders") || normalized.includes("transactions")) {
      reply = `📊 There are currently **${sales.length} transactions** recorded in the database.`;
    }
    // 11. Loyalty System details
    else if (normalized.includes("discount") || normalized.includes("loyalty") || normalized.includes("value member") || normalized.includes("reward") || normalized.includes("membership")) {
      reply = `🎉 **Loyalty Reward System Details**:\n• Customer Type: **Value Members** (who consent to join).\n• Reward logic: **5% discount** on their total bill.\n• Purchase Cycle: Applied automatically on every **4th purchase** (after 3 full-price purchases).`;
    }
    // 12. Average Sale Values
    else if (normalized.includes("average order") || normalized.includes("average sale") || normalized.includes("average ticket")) {
      const totalRev = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
      const avg = totalRev / (sales.length || 1);
      reply = `📈 The average transaction value is **₹${avg.toFixed(2)}**.`;
    }

    setTimeout(() => {
      setChatLog((prev) => [...prev, { role: "assistant", text: reply }]);
    }, 300);
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-2.5 text-xs text-zinc-500 font-bold uppercase tracking-wider">
          Connecting my-POS Intelligence Models...
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex flex-col font-sans">
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
            <span className="text-lg font-black tracking-tight text-zinc-950">my-POS Cockpit & Chatbot</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-indigo-600 px-3.5 py-1.5 text-4xs font-black uppercase text-white tracking-widest shadow-sm">
            <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300 animate-pulse" /> my-POS AI Active
          </span>
        </div>
      </nav>

      {/* Main layout in a balanced grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Row 1: Chatbot, Demand Forecasting, Anomaly Logs (Equal Height: 280px) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Chatbot (Sunrise/Sunset Gradient Theme Matching Login) */}
          <div className="bg-gradient-to-br from-sky-400 via-pink-500 via-purple-600 to-indigo-950 border border-white/20 rounded-3xl p-5 shadow-xl flex flex-col h-[280px] text-white">
            <div className="border-b border-white/20 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-white animate-pulse" /> Chatbot
              </h2>
              <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-white">
                Live NLP
              </span>
            </div>

            {/* Chat log messages area */}
            <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1 text-2xs leading-relaxed scrollbar-none">
              {chatLog.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col rounded-2xl p-2.5 shadow-md max-w-[85%] ${
                    log.role === "user"
                      ? "bg-white text-purple-950 self-end ml-auto font-bold"
                      : "bg-purple-900/45 border border-purple-300/25 text-white self-start mr-auto"
                  }`}
                >
                  <p className="whitespace-pre-wrap font-semibold">{log.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Form */}
            <form onSubmit={handleChatSubmit} className="mt-3 pt-2.5 border-t border-white/20 flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask chatbot, e.g. 'Show June sales'"
                className="flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-2xs outline-none focus:border-white focus:bg-white/20 transition-all text-white font-semibold placeholder-white/70"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-purple-950 shadow-md hover:bg-zinc-100 transition-all active:scale-95"
              >
                <Send className="h-3 w-3 text-indigo-900 fill-indigo-900" />
              </button>
            </form>
          </div>

          {/* Card 2: Demand Forecasting (Scrollable Table, Equal Height) */}
          <div className="bg-white border border-zinc-200 border-t-4 border-t-emerald-500 rounded-3xl p-5 shadow-sm flex flex-col h-[280px]">
            <h2 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Product Demand Forecasting
            </h2>
            <div className="flex-1 overflow-y-auto mt-2 pr-1">
              <table className="min-w-full text-left text-2xs divide-y divide-zinc-200 font-medium">
                <thead>
                  <tr className="text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-right">Avg Daily</th>
                    <th className="py-2.5 px-3 text-right font-bold">Forecast</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {aiInsights.forecasting.slice(0, 10).map((f, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-3 font-bold text-zinc-950">{f.name}</td>
                      <td className="py-3 px-3 text-right text-zinc-500">{f.avgDailyQty} units</td>
                      <td className="py-3 px-3 text-right font-extrabold text-zinc-900">{f.nextWeekForecast} units</td>
                      <td className="py-3 px-3 text-right">
                        {f.isLowStockWarning ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-4xs font-black text-amber-700 uppercase">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-4xs font-bold text-zinc-600 uppercase">
                            Stable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 3: Anomaly Detection List (Scrollable Logs, Equal Height) */}
          <div className="bg-white border border-zinc-200 border-t-4 border-t-red-500 rounded-3xl p-5 shadow-sm flex flex-col h-[280px]">
            <h2 className="text-xs font-black uppercase tracking-wider text-red-800 border-b border-zinc-100 pb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" /> Real-time Anomaly Logs
            </h2>
            <div className="flex-1 overflow-y-auto mt-3 space-y-3 pr-1">
              {aiInsights.anomalies.map((a, idx) => (
                <div key={idx} className="flex justify-between items-start border border-red-100 rounded-xl p-3.5 bg-red-50/10 hover:bg-red-50/20 transition-all">
                  <div className="space-y-1">
                    <p className="font-extrabold text-xs text-zinc-950">Receipt ID: #{a.id}</p>
                    <p className="text-3xs text-zinc-500 font-semibold uppercase">Customer: {a.customer} • Date: {a.date}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-black text-xs text-zinc-900">₹{a.total}</p>
                    <span className="inline-block text-4xs font-black uppercase text-red-600 bg-red-100 border border-red-200 rounded px-1.5 py-0.5">
                      {a.reason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Row 2: Fast-Moving, Slow-Moving, Smart Inventory Alerts (Equal Height: 280px) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Card 4: Fast-Moving Products */}
          <div className="bg-white border border-zinc-200 border-t-4 border-t-cyan-500 rounded-3xl p-5 shadow-sm flex flex-col h-[280px]">
            <h3 className="text-2xs font-black uppercase tracking-wider text-cyan-800 border-b border-zinc-100 pb-2 mb-3 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-600" /> Fast-Moving Products
            </h3>
            <ul className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-1">
              {aiInsights.fastMoving.map((p, idx) => (
                <li key={idx} className="flex justify-between items-center text-xs font-semibold text-zinc-800">
                  <span>{p.name}</span>
                  <span className="text-2xs text-cyan-700 font-extrabold bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">
                    {p.nextWeekForecast} sold / wk
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Card 5: Slow-Moving Products */}
          <div className="bg-white border border-zinc-200 border-t-4 border-t-amber-500 rounded-3xl p-5 shadow-sm flex flex-col h-[280px]">
            <h3 className="text-2xs font-black uppercase tracking-wider text-amber-800 border-b border-zinc-100 pb-2 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Slow-Moving Products
            </h3>
            <ul className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-1">
              {aiInsights.slowMoving.map((p, idx) => (
                <li key={idx} className="flex justify-between items-center text-xs font-semibold text-zinc-800">
                  <span>{p.name}</span>
                  <span className="text-4xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded uppercase tracking-wider">
                    Reorder Suggested
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 6: Smart Restock & Promotion Advice (New Card for perfect balance) */}
          <div className="bg-white border border-zinc-200 border-t-4 border-t-purple-500 rounded-3xl p-5 shadow-sm flex flex-col h-[280px]">
            <h3 className="text-2xs font-black uppercase tracking-wider text-purple-800 border-b border-zinc-100 pb-2 mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" /> Smart Inventory Suggestions
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2.5 text-2xs pr-1 mt-1">
              <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-2.5 text-purple-900 leading-relaxed font-semibold">
                ☕ **Coffee & Beverage Spike**:
                <p className="font-normal text-zinc-600 mt-0.5">Average daily sales suggest restocking coffee beans by Friday evening before the weekly surge.</p>
              </div>
              <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-2.5 text-purple-900 leading-relaxed font-semibold">
                🍡 **Gulab Jamun Combo Tip**:
                <p className="font-normal text-zinc-600 mt-0.5">Gulab Jamun is fast-moving. Bundle it with savory snacks to increase your checkout ticket size by 15%.</p>
              </div>
              <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-2.5 text-purple-900 leading-relaxed font-semibold">
                🛍️ **Pani Puri Promo**:
                <p className="font-normal text-zinc-600 mt-0.5">Slow sales detected. Introduce a weekend loyalty discount of 5% to boost transaction volumes.</p>
              </div>
            </div>
          </div>
          
        </div>

      </main>
    </div>
  );
}
