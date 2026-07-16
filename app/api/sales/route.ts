import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { customer_id, cart } = body; // cart: Array of { id, quantity }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Get a default user from users table for user_id (since we don't have login yet)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .limit(1)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "No users found in database. Make sure users are seeded." },
        { status: 500 }
      );
    }
    const defaultUserId = userData.id;

    // 2. Fetch current stock levels for all products in cart
    const productIds = cart.map((item) => item.id);
    const { data: dbProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, stock_quantity, price")
      .in("id", productIds);

    if (productsError || !dbProducts) {
      return NextResponse.json({ error: "Failed to verify product stock" }, { status: 500 });
    }

    // Create a map for easy lookup
    const dbProductsMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 3. Verify stock availability and calculate total
    let calculatedTotal = 0;
    for (const cartItem of cart) {
      const dbProduct = dbProductsMap.get(cartItem.id);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product with ID ${cartItem.id} not found.` },
          { status: 400 }
        );
      }

      if (dbProduct.stock_quantity < cartItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${dbProduct.name}. Available: ${dbProduct.stock_quantity}, Requested: ${cartItem.quantity}`,
          },
          { status: 400 }
        );
      }

      calculatedTotal += Number(dbProduct.price) * cartItem.quantity;
    }

    // 4. Create the sale header record
    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          customer_id: customer_id || null,
          user_id: defaultUserId,
          total_amount: calculatedTotal,
          sale_date: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (saleError || !saleData) {
      return NextResponse.json(
        { error: `Failed to create sale: ${saleError?.message || "Unknown error"}` },
        { status: 500 }
      );
    }
    const saleId = saleData.id;

    // 5. Create sale items
    const saleItemsToInsert = cart.map((cartItem) => {
      const dbProduct = dbProductsMap.get(cartItem.id)!;
      return {
        sale_id: saleId,
        product_id: cartItem.id,
        quantity: cartItem.quantity,
        unit_price: dbProduct.price,
      };
    });

    const { error: itemsError } = await supabase.from("sale_items").insert(saleItemsToInsert);

    if (itemsError) {
      // Clean up the created sale header if items insert fails (manual rollback)
      await supabase.from("sales").delete().eq("id", saleId);
      return NextResponse.json(
        { error: `Failed to save sale items: ${itemsError.message}` },
        { status: 500 }
      );
    }

    // 6. Update product stock (decrement stock_quantity)
    for (const cartItem of cart) {
      const dbProduct = dbProductsMap.get(cartItem.id)!;
      const newStock = dbProduct.stock_quantity - cartItem.quantity;

      const { error: updateStockError } = await supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", cartItem.id);

      if (updateStockError) {
        console.error(
          `Failed to update stock for product ${cartItem.id}:`,
          updateStockError.message
        );
      }
    }

    return NextResponse.json({
      success: true,
      sale_id: saleId,
      total_amount: calculatedTotal,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
