import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSong() {
  return (
    <div>
      <Skeleton className="mb-4 h-5 w-20" />
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="mb-5 h-14 w-full rounded-xl" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-6" style={{ width: `${90 - i * 6}%` }} />
        ))}
      </div>
    </div>
  );
}
