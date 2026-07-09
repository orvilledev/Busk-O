import Link from "next/link";
import { ArrowLeft, Music } from "lucide-react";
import { Tuner } from "@/components/tuner/tuner";

export const metadata = { title: "Tuner · Busk-O" };

export default function TunerPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Music className="h-4 w-4" />
          </span>
          Busk-O
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Guitar tuner</h1>
      <p className="mb-8 text-sm text-muted">Standard tuning · E A D G B E</p>

      <Tuner />
    </main>
  );
}
