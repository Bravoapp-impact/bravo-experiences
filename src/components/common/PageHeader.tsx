import { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
  iconColor,
  className = "",
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-h-[44px]",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="h-7 w-7 shrink-0 rounded-md bg-muted flex items-center justify-center">
            <Icon className={cn("h-4 w-4", iconColor || "text-muted-foreground")} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight leading-tight truncate">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-[13px]">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}
