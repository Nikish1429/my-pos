import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, address, is_value_member, purchases_count")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase client not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { name, phone, address, is_value_member } = body;

    if (!name || !address) {
      return NextResponse.json({ error: "Name and address are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("customers")
      .insert([
        {
          name,
          phone: phone || null,
          address,
          is_value_member: !!is_value_member,
          purchases_count: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
