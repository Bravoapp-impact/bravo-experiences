import { ReactNode } from "react";
import { CrudSearchBar } from "./CrudSearchBar";
import { cn } from "@/lib/utils";

interface CrudTableCardProps {
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  hideSearch?: boolean;
}

/**
 * Flat CRUD list section: title + actions row, optional search/filters row,
 * then content (typically a table). No card wrapper — uses the page background
 * with a hairline separator under the header (Attio-style).
 *
 * The component name is kept for backward compatibility but it no longer renders
 * a <Card>. Use this for any admin list/table page.
 */
export function CrudTableCard({
  title,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Cerca...",
  filters,
  actions,
  children,
  className,
  hideSearch = false,
}: CrudTableCardProps) {
  const showSearchRow = !hideSearch && onSearchChange;

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header row: title + actions */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      {/* Search and filters row */}
      {(showSearchRow || filters) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {showSearchRow && (
            <CrudSearchBar
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="sm:w-64"
            />
          )}
          {filters && (
            <div className="flex flex-wrap items-center gap-2">
              {filters}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
