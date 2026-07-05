import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSetlists() {
  return (
    <div>
      <Skeleton className="mb-6 h-7 w-28" />
      <Skeleton className="mb-6 h-16 w-full rounded-xl" />
      <div className="divide-y divide-border rounded-xl border border-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
