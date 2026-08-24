import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Setup Required" };

export default function SetupRequiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08090b] px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-2xl sm:p-10">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
          <AlertTriangle className="size-6 text-amber-400" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Supabase Not Configured</h1>
        <p className="mt-2 text-sm text-white/60">
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are
          missing from your environment. Follow{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">ADMIN_SETUP.md</code> in the project root, then
          restart the dev server.
        </p>
      </div>
    </div>
  );
}
