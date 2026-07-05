import { CloudOff } from "lucide-react";

export const metadata = { title: "Offline · Busk-O" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center p-6 text-center">
      <CloudOff className="mb-4 h-10 w-10 text-muted" />
      <h1 className="text-xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        This page hasn&apos;t been saved for offline use yet. Songs and setlists
        you&apos;ve already opened are still available — head back and pick one.
      </p>
    </main>
  );
}
