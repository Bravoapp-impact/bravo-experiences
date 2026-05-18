import { motion } from "framer-motion";
import { Users, UserCheck, UserPlus, UserX, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type EmployeeSegment = "all" | "top" | "active" | "inactive" | "new";

interface EmployeeMetricsCardsProps {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  newThisMonthCount: number;
  activeSegment: EmployeeSegment;
  onSegmentChange: (segment: EmployeeSegment) => void;
}

interface MetricDef {
  segment: EmployeeSegment;
  label: string;
  value: string | number;
  subLabel?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export function EmployeeMetricsCards({
  totalCount,
  activeCount,
  inactiveCount,
  newThisMonthCount,
  activeSegment,
  onSegmentChange,
}: EmployeeMetricsCardsProps) {
  const metrics: MetricDef[] = [
    {
      segment: "all",
      label: "Registrati",
      value: totalCount,
      icon: Users,
      iconColor: "text-blue-500",
      iconBgColor: "bg-blue-500/10",
    },
    {
      segment: "active",
      label: "Attivi",
      value: activeCount,
      icon: UserCheck,
      iconColor: "text-primary",
      iconBgColor: "bg-primary/10",
    },
    {
      segment: "inactive",
      label: "Da coinvolgere",
      value: inactiveCount,
      icon: UserX,
      iconColor: "text-bravo-orange",
      iconBgColor: "bg-bravo-orange/10",
    },
    {
      segment: "new",
      label: "Nuovi questo mese",
      value: newThisMonthCount,
      icon: UserPlus,
      iconColor: "text-bravo-purple",
      iconBgColor: "bg-bravo-purple/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((m, i) => {
        const isActive = activeSegment === m.segment;
        const Icon = m.icon;
        return (
          <motion.button
            key={m.segment}
            type="button"
            onClick={() => onSegmentChange(m.segment)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
            aria-pressed={isActive}
          >
            <Card
              className={cn(
                "h-full transition-all bg-card/80 backdrop-blur-sm hover:shadow-md",
                isActive
                  ? "border-primary/60 bg-primary/[0.04] shadow-sm"
                  : "border-border/50",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={cn("p-2.5 sm:p-3 rounded-xl shrink-0", m.iconBgColor)}>
                    <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", m.iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold text-foreground">{m.value}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {m.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.button>
        );
      })}
    </div>
  );
}
