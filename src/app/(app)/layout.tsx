import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/config";
import { AppNav } from "@/components/app-nav";
import { BottomNav } from "@/components/bottom-nav";
import { SyncProvider } from "@/components/offline/sync-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No backend → the full multi-user app is unavailable; use "try" mode.
  if (!supabaseConfigured) redirect("/try");

  return (
    <SyncProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <AppNav />
        {/* pb clears the fixed bottom tab bar (its height + safe area). */}
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-[calc(72px+env(safe-area-inset-bottom))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </SyncProvider>
  );
}
