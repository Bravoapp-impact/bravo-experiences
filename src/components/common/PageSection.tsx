import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageSectionProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Adds a bottom hairline. Useful when stacking multiple sections on the same flat background.
   */
  divider?: boolean;
}

/**
 * Flat page section — no card wrapper, just a title/description header and content.
 * Use instead of <Card> for tables, lists, secondary widgets, settings groups.
 * Card should remain only for elements that must visually pop (hero metric cards,
 * booking sidebar on experience detail, grid item cards).
 */
export default function PageSection({
  title,
  description,
  actions,
  children,
  className,
  divider = false,
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "py-6 first:pt-0",
        divider && "border-b border-border",
        className,
      )}
    >
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
