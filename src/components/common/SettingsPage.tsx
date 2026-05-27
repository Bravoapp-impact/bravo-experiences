import { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
}

export default function SettingsPage({
  title,
  description,
  icon: Icon,
  iconColor,
  children,
  className,
}: SettingsPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <div className="flex items-center gap-3 mb-6 min-w-0">
        {Icon && (
          <div className="h-7 w-7 shrink-0 flex items-center justify-center">
            <Icon className={cn("h-5 w-5", iconColor || "text-muted-foreground")} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight leading-tight truncate text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-[13px]">{description}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}
