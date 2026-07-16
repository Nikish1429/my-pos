import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
  }

  try {
    // 1. Fetch sales from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("total_amount, sale_date")
      .gte("sale_date", sevenDaysAgo.toISOString());

    if (salesError || !sales) {
      return NextResponse.json({ error: salesError?.message || "Failed to fetch sales" }, { status: 500 });
    }

    // 2. Group by calendar date (YYYY-MM-DD) and sum the revenue
    const dailyRevenue: { [key: string]: number } = {};
    
    // Initialize all past 7 days with 0 to handle days with no sales correctly
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyRevenue[dateStr] = 0;
    }

    sales.forEach((sale) => {
      const dateStr = new Date(sale.sale_date).toISOString().split("T")[0];
      if (dailyRevenue[dateStr] !== undefined) {
        dailyRevenue[dateStr] += Number(sale.total_amount);
      }
    });

    // 3. Calculate 7-day Simple Moving Average (SMA)
    const revenues = Object.values(dailyRevenue);
    const sum = revenues.reduce((acc, val) => acc + val, 0);
    const predictedSales = sum / 7;

    return NextResponse.json({
      predictedSales: Number(predictedSales.toFixed(2)),
      dailyData: dailyRevenue,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
