import { getSupabase } from "@/lib/supabase";

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

  if (setup.configured) {
    const supabase = getSupabase()!;
    const { error } = await supabase.auth.getSession();
    connectionOk = !error;
    connectionStatus = error
      ? `Could not connect: ${error.message}`
      : "Connected to Supabase";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 font-sans">
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

        <div className="mt-8 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">Next steps</p>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>
              Open{" "}
              <code className="rounded bg-zinc-200 px-1">.env.local</code> and
              paste your Supabase credentials
            </li>
            <li>
              Run <code className="rounded bg-zinc-200 px-1">npm run dev</code>{" "}
              (or restart it if it is already running)
            </li>
            <li>Refresh this page to see &quot;Connected to Supabase&quot;</li>
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
