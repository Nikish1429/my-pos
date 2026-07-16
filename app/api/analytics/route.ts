import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
  }

  try {
    // 1. Fetch all sales with customer region and user info
    const { data: sales, error: salesErr } = await supabase
      .from("sales")
      .select("id, total_amount, sale_date, customers(name, region), users(name)");

    if (salesErr || !sales) {
      throw salesErr || new Error("Failed to fetch sales");
    }

    // 2. Fetch all sale items with product info
    const { data: saleItems, error: itemsErr } = await supabase
      .from("sale_items")
      .select("quantity, unit_price, products(name, category), sales(sale_date)");

    if (itemsErr || !saleItems) {
      throw itemsErr || new Error("Failed to fetch sale items");
    }

    // --- AGGREGATION LOGIC ---

    // KPI Calculations
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);
    const totalOrders = sales.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // A. Revenue Over Time (Grouped by Month)
    const monthlyRevenueMap: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Sort chronologically by parsing date
    sales.forEach((s) => {
      const date = new Date(s.sale_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
      monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + Number(s.total_amount);
    });

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

    // B. Revenue by Region (Grouped by Region)
    const regionalRevenueMap: { [key: string]: number } = {
      North: 0,
      South: 0,
      East: 0,
      West: 0,
      Central: 0,
    };

    sales.forEach((s: any) => {
      const region = s.customers?.region || "Walk-in";
      regionalRevenueMap[region] = (regionalRevenueMap[region] || 0) + Number(s.total_amount);
    });

    const revenueByRegion = Object.keys(regionalRevenueMap).map((region) => ({
      region,
      revenue: Number(regionalRevenueMap[region].toFixed(2)),
    }));

    // C. Top Products (Grouped by Product Name)
    const productQtyMap: { [key: string]: number } = {};
    saleItems.forEach((item: any) => {
      const prodName = item.products?.name || "Unknown Product";
      productQtyMap[prodName] = (productQtyMap[prodName] || 0) + Number(item.quantity);
    });

    const topProducts = Object.keys(productQtyMap)
      .map((name) => ({ name, quantity: productQtyMap[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // D. Sales by Category (Grouped by Category)
    const categoryValueMap: { [key: string]: number } = {};
    saleItems.forEach((item: any) => {
      const category = item.products?.category || "Other";
      const value = Number(item.quantity) * Number(item.unit_price);
      categoryValueMap[category] = (categoryValueMap[category] || 0) + value;
    });

    const salesByCategory = Object.keys(categoryValueMap).map((category) => ({
      name: category,
      value: Number(categoryValueMap[category].toFixed(2)),
    }));

    // E. Top Customers (Grouped by Customer Name)
    const customerSpendingMap: { [key: string]: number } = {};
    sales.forEach((s: any) => {
      const custName = s.customers?.name || "Walk-in (Guest)";
      customerSpendingMap[custName] = (customerSpendingMap[custName] || 0) + Number(s.total_amount);
    });

    const topCustomers = Object.keys(customerSpendingMap)
      .map((name) => ({ name, spent: Number(customerSpendingMap[name].toFixed(2)) }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    return NextResponse.json({
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
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
