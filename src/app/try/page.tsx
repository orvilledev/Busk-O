import Link from "next/link";
import { Music } from "lucide-react";
import { Playground } from "@/components/try/playground";

export const metadata = { title: "Try Busk-O" };

export default function TryPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/try" className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Music className="h-4 w-4" />
          </span>
          Busk-O
        </Link>
      </div>
      <Playground />
    </main>
  );
}
