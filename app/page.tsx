import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
};

function getSetupStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const hasPlaceholders =
    url.includes("your-project-url-here") ||
    key.includes("your-anon-key-here");

  if (!url || !key || hasPlaceholders) {
    return {
      configured: false,
      message:
        "Add your real Supabase URL and anon key to .env.local, then restart the dev server.",
    };
  }

  return { configured: true, message: null };
}

export default async function Home() {
  const setup = getSetupStatus();

  let connectionStatus = "Not tested yet";
  let connectionOk = false;
  let products: Product[] = [];
  let productsError: string | null = null;

  if (setup.configured) {
    const supabase = getSupabase()!;
    const { error } = await supabase.auth.getSession();
    connectionOk = !error;
    connectionStatus = error
      ? `Could not connect: ${error.message}`
      : "Connected to Supabase";

    if (connectionOk) {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, name, price")
        .order("name");

      if (fetchError) {
        productsError = fetchError.message;
      } else {
        products = data ?? [];
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-10 font-sans">
      <main className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">my-POS</h1>
        <p className="mt-2 text-zinc-600">
          Your Next.js app with Supabase is ready.
        </p>

        <div className="mt-8 space-y-4">
          <StatusRow
            label="Environment variables"
            ok={setup.configured}
            detail={
              setup.configured
                ? "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set"
                : setup.message!
            }
          />
          <StatusRow
            label="Supabase connection"
            ok={connectionOk}
            detail={
              setup.configured
                ? connectionStatus
                : "Fill in .env.local first, then refresh this page"
            }
          />
        </div>

        {setup.configured && connectionOk && (
          <div className="mt-8">
            <h2 className="font-medium text-zinc-900">Products</h2>
            {productsError ? (
              <p className="mt-2 text-sm text-amber-700">
                Could not load products: {productsError}. Run{" "}
                <code className="rounded bg-zinc-200 px-1">supabase/setup.sql</code>{" "}
                in your Supabase SQL Editor.
              </p>
            ) : products.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-600">
                No products yet. Run{" "}
                <code className="rounded bg-zinc-200 px-1">supabase/setup.sql</code>{" "}
                in your Supabase SQL Editor.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-100">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-zinc-900">{product.name}</span>
                    <span className="font-medium text-zinc-700">
                      ${Number(product.price).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-8 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">Setup checklist</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>
              Paste Supabase credentials into{" "}
              <code className="rounded bg-zinc-200 px-1">.env.local</code>
            </li>
            <li>
              Run{" "}
              <code className="rounded bg-zinc-200 px-1">
                supabase/setup.sql
              </code>{" "}
              in Supabase SQL Editor
            </li>
            <li>
              <Link href="/inventory" className="font-semibold text-zinc-900 underline hover:text-zinc-600">
                Go to Inventory Manager
              </Link>
            </li>
            <li>
              <Link href="/billing" className="font-semibold text-zinc-900 underline hover:text-zinc-600">
                Go to Billing Terminal (Checkout)
              </Link>
            </li>
            <li>
              <Link href="/history" className="font-semibold text-zinc-900 underline hover:text-zinc-600">
                Go to Transaction History
              </Link>
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-zinc-100 p-4">
      <span
        className={`mt-0.5 h-3 w-3 shrink-0 rounded-full ${
          ok ? "bg-green-500" : "bg-amber-400"
        }`}
        aria-hidden
      />
      <div>
        <p className="font-medium text-zinc-900">{label}</p>
        <p className="mt-1 text-sm text-zinc-600">{detail}</p>
      </div>
    </div>
  );
}
