import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSetlist() {
  return (
    <div>
      <Skeleton className="mb-4 h-5 w-20" />
      <div className="mb-6 flex items-start justify-between gap-2">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-44" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
