import { Users, Clock, Heart, CheckCircle, TrendingUp, Hourglass } from "lucide-react";
import { MetricCard } from "@/components/common/MetricCard";

interface MetricsCardsProps {
  employeesCount: number;
  participationRate: number;
  totalVolunteerHours: number;
  totalBeneficiaries: number;
  totalParticipations: number;
  budgetHoursPerEmployee?: number | null;
}

export function MetricsCards({
  employeesCount,
  participationRate,
  totalVolunteerHours,
  totalBeneficiaries,
  totalParticipations,
  budgetHoursPerEmployee,
}: MetricsCardsProps) {
  const metrics = [
    {
      label: "Utenti Registrati",
      value: employeesCount,
      icon: Users,
      color: "text-bravo-purple",
      bgColor: "bg-bravo-purple/10",
    },
    {
      label: "Tasso di Partecipazione",
      value: `${participationRate}%`,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Ore di Volontariato",
      value: totalVolunteerHours.toFixed(1),
      icon: Clock,
      color: "text-bravo-orange",
      bgColor: "bg-bravo-orange/10",
    },
    {
      label: "Beneficiari Raggiunti",
      value: totalBeneficiaries,
      icon: Heart,
      color: "text-bravo-pink",
      bgColor: "bg-bravo-pink/10",
    },
    {
      label: "Partecipazioni Totali",
      value: totalParticipations,
      icon: CheckCircle,
      color: "text-bravo-purple",
      bgColor: "bg-bravo-purple/10",
    },
    {
      label: "Budget Ore / Dipendente",
      value: budgetHoursPerEmployee && budgetHoursPerEmployee > 0
        ? `${budgetHoursPerEmployee} ore/anno`
        : "Illimitato",
      icon: Hourglass,
      color: "text-bravo-orange",
      bgColor: "bg-bravo-orange/10",
    },
  ];

  const topRow = metrics.slice(0, 3);
  const bottomRow = metrics.slice(3);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {topRow.map((metric, index) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            iconColor={metric.color}
            iconBgColor={metric.bgColor}
            animationDelay={index * 0.1}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {bottomRow.map((metric, index) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            iconColor={metric.color}
            iconBgColor={metric.bgColor}
            animationDelay={(3 + index) * 0.1}
          />
        ))}
      </div>
    </div>
  );
}
