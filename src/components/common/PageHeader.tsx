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
        "relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-h-[44px] pb-3 after:absolute after:bottom-0 after:left-[-1rem] after:right-[-1rem] sm:after:left-[-1.5rem] sm:after:right-[-1.5rem] lg:after:left-[-2rem] lg:after:right-[-2rem] after:h-px after:bg-border/60",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="h-7 w-7 shrink-0 flex items-center justify-center">
            <Icon className={cn("h-5 w-5", iconColor || "text-muted-foreground")} />
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
