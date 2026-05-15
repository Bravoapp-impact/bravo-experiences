import { Skeleton } from "@/components/ui/skeleton";

type Role = "employee" | "admin";

interface AppBootSkeletonProps {
  /** "employee" mimics the mobile shell, "admin" mimics the sidebar shell. */
  role?: Role;
}

/**
 * Neutral full-screen skeleton shown while authentication is being resolved.
 * Replaces the previous centered spinner to remove the "spinner → spinner →
 * content" flicker between route guards and pages.
 */
export function AppBootSkeleton({ role = "admin" }: AppBootSkeletonProps) {
  if (role === "employee") {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 right-0 flex items-center justify-around border-t bg-background px-4 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r p-4 md:block">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      {/* Main */}
      <div className="flex-1 p-6">
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="mb-6 h-4 w-80 max-w-full" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
