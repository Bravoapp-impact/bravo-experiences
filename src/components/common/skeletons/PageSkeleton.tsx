import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Variant = "list" | "table" | "detail" | "dashboard" | "form" | "grid" | "calendar";

interface PageSkeletonProps {
  variant?: Variant;
  className?: string;
  /** Number of rows/cards to render. */
  rows?: number;
}

/**
 * Generic in-layout skeleton that mimics the structure of common page layouts.
 * Use inside the page's layout wrapper instead of a centered spinner.
 */
export function PageSkeleton({ variant = "list", className, rows = 6 }: PageSkeletonProps) {
  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {variant === "dashboard" && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-64 rounded-xl lg:col-span-2" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </>
      )}

      {variant === "calendar" && (
        <div className="space-y-3">
          {/* CalendarHeader placeholder */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-14 rounded-md" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-40 rounded-md" />
            </div>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 border rounded-t-lg overflow-hidden bg-muted/30">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-none" />
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 border rounded-b-lg overflow-hidden -mt-px">
            {Array.from({ length: 42 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[90px] sm:min-h-[110px] border-b border-r p-1"
              >
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {variant === "table" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="ml-auto h-9 w-28" />
          </div>
          <div className="overflow-hidden rounded-lg border">
            <Skeleton className="h-10 w-full rounded-none" />
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none border-t" />
            ))}
          </div>
        </div>
      )}

      {variant === "list" && (
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      )}

      {variant === "grid" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {variant === "detail" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="aspect-[16/9] w-full rounded-xl" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      )}

      {variant === "form" && (
        <div className="max-w-2xl space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  );
}
