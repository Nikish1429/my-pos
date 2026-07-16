import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
  }

  try {
    // 1. Fetch all raw sales
    const { data: sales, error: salesErr } = await supabase
      .from("sales")
      .select("id, total_amount, sale_date, customer_id, user_id, customers(id, name, address), users(name)");

    if (salesErr || !sales) {
      throw salesErr || new Error("Failed to fetch sales");
    }

    // 2. Fetch all raw sale items
    const { data: saleItems, error: itemsErr } = await supabase
      .from("sale_items")
      .select("id, sale_id, product_id, quantity, unit_price, products(name, category)");

    if (itemsErr || !saleItems) {
      throw itemsErr || new Error("Failed to fetch sale items");
    }

    return NextResponse.json({
      sales,
      saleItems,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
