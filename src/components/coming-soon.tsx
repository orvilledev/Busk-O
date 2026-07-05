import Link from "next/link";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <Construction className="mb-3 h-8 w-8 text-muted" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mb-4 mt-1 text-sm text-muted">Coming in {phase}.</p>
      <Link href="/songs">
        <Button variant="secondary" size="sm">
          Back to Songs
        </Button>
      </Link>
    </div>
  );
}
