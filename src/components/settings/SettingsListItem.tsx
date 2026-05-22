import { Link } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsListItemProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  to: string;
  iconColor?: string;
}

export function SettingsListItem({
  icon: Icon,
  title,
  description,
  to,
  iconColor = "text-foreground",
}: SettingsListItemProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 py-4 min-h-[64px] border-b border-border last:border-b-0 hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
    >
      <div className="flex items-center justify-center h-10 w-10 shrink-0">
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </Link>
  );
}
