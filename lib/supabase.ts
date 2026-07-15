import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const hasPlaceholders =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("your-project-url-here") ||
    supabaseAnonKey.includes("your-anon-key-here");

  if (hasPlaceholders) {
    return null;
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }

  return client;
}
