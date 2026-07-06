import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingFavorites() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-7 w-28" />
      </div>
      <Skeleton className="mb-3 h-10 w-full" />
      <div className="divide-y divide-border rounded-xl border border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
