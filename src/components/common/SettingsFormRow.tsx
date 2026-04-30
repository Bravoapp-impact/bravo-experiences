import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SettingsFormRowProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Two-column settings row: label/description on the left, form controls on the right.
 * Stacks on mobile. Right column is width-constrained to keep inputs readable.
 */
export default function SettingsFormRow({
  title,
  description,
  children,
  className,
}: SettingsFormRowProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 py-8 first:pt-0 last:pb-0", className)}>
      <div className="md:col-span-1 space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      <div className="md:col-span-2 max-w-md">{children}</div>
    </div>
  );
}
