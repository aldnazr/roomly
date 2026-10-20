import { Skeleton } from "@/components/ui/skeleton";

interface RoomDetailSkeletonProps {
  label?: string;
}

export function RoomDetailSkeleton({ label = "Loading room" }: RoomDetailSkeletonProps) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      <Skeleton className="h-8 w-28 rounded-full" />
      <Skeleton className="aspect-21/9 w-full rounded-3xl" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          <Skeleton className="h-8 w-1/2 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
        </div>
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
      <span className="sr-only">Loading room…</span>
    </div>
  );
}
