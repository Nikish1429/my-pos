import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productIdStr = searchParams.get("id");

    if (!productIdStr) {
      return NextResponse.json({ error: "Product ID parameter is required" }, { status: 400 });
    }
    const productId = parseInt(productIdStr);

    // 1. Find all sale IDs that contain the given product
    const { data: containingSales, error: containingError } = await supabase
      .from("sale_items")
      .select("sale_id")
      .eq("product_id", productId);

    if (containingError) {
      return NextResponse.json({ error: containingError.message }, { status: 500 });
    }

    const saleIds = Array.from(new Set((containingSales || []).map((item) => item.sale_id)));

    // Fallback: If this product has never been sold, return the top 3 best-selling products overall
    if (saleIds.length === 0) {
      const { data: topProducts, error: topError } = await supabase
        .from("sale_items")
        .select("product_id, products(id, name, price, category, stock_quantity)")
        .limit(10); // get some items to aggregate

      if (topError || !topProducts) {
        return NextResponse.json([]);
      }

      // Count occurrences
      const counts: { [key: number]: { count: number; product: any } } = {};
      (topProducts as any[]).forEach((item) => {
        if (item.products) {
          const prod = Array.isArray(item.products) ? item.products[0] : item.products;
          if (!prod) return;
          const id = prod.id;
          if (id === productId) return; // skip query product
          if (!counts[id]) {
            counts[id] = { count: 0, product: prod };
          }
          counts[id].count += 1;
        }
      });

      const sorted = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((x) => x.product);

      return NextResponse.json(sorted);
    }

    // 2. Find all co-occurring products in those sales, excluding the original product itself
    const { data: coOccurringItems, error: coOccurError } = await supabase
      .from("sale_items")
      .select("product_id, products(id, name, price, category, stock_quantity)")
      .in("sale_id", saleIds)
      .neq("product_id", productId);

    if (coOccurError || !coOccurringItems) {
      return NextResponse.json({ error: coOccurError?.message || "Failed to fetch items" }, { status: 500 });
    }

    // 3. Count frequencies of co-occurring products
    const frequencies: { [key: number]: { count: number; product: any } } = {};
    (coOccurringItems as any[]).forEach((item) => {
      if (item.products) {
        const prod = Array.isArray(item.products) ? item.products[0] : item.products;
        if (!prod) return;
        const id = prod.id;
        if (!frequencies[id]) {
          frequencies[id] = { count: 0, product: prod };
        }
        frequencies[id].count += 1;
      }
    });

    // 4. Sort and return the top 3 recommendations
    const recommendations = Object.values(frequencies)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((x) => x.product);

    return NextResponse.json(recommendations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
