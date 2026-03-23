import { motion } from "framer-motion";
import { Clock, UserCheck, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface EmployeeStats {
  id: string;
  total_experiences: number;
  total_hours: number;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface EmployeeMetricsCardsProps {
  employees: EmployeeStats[];
  monthlyTrend: MonthlyData[];
}

export function EmployeeMetricsCards({
  employees,
  monthlyTrend,
}: EmployeeMetricsCardsProps) {
  // Calculate metrics
  const activeEmployees = employees.filter((e) => e.total_experiences > 0);
  const totalHours = employees.reduce((sum, e) => sum + e.total_hours, 0);

  const avgHoursPerEmployee =
    activeEmployees.length > 0
      ? (totalHours / activeEmployees.length).toFixed(1)
      : "0";

  const activePercentage =
    employees.length > 0
      ? Math.round((activeEmployees.length / employees.length) * 100)
      : 0;

  // Get current month trend indicator
  const currentMonthCount = monthlyTrend[monthlyTrend.length - 1]?.count || 0;
  const previousMonthCount = monthlyTrend[monthlyTrend.length - 2]?.count || 0;
  const trendDirection =
    currentMonthCount >= previousMonthCount ? "up" : "down";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Ore Medie per Dipendente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-bravo-orange/10 shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-bravo-orange" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-foreground">
                  {avgHoursPerEmployee}h
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                   Ore Medie per Utente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Percentuale Dipendenti Attivi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-bravo-purple/10 shrink-0">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-bravo-purple" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xl font-bold text-foreground">
                  {activePercentage}%
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                   Utenti Attivi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trend Mensile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${
                  trendDirection === "up"
                    ? "bg-primary/10"
                    : "bg-destructive/10"
                }`}
              >
                <TrendingUp
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    trendDirection === "up"
                      ? "text-primary"
                      : "text-destructive rotate-180"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-muted-foreground leading-tight mb-2">
                  Trend Partecipazioni
                </p>
                {monthlyTrend.length > 0 ? (
                  <div className="h-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrend} barCategoryGap="20%">
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {monthlyTrend.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === monthlyTrend.length - 1
                                  ? "hsl(var(--primary))"
                                  : "hsl(var(--primary) / 0.3)"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nessun dato disponibile
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
