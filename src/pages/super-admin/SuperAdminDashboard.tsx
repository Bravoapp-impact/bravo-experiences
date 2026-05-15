import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  Calendar,
  Clock,
  Heart,
  Home,
  TrendingUp,
} from "lucide-react";

import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { MetricCard } from "@/components/common/MetricCard";

interface DashboardStats {
  totalCompanies: number;
  totalUsers: number;
  totalExperiences: number;
  publishedExperiences: number;
  totalBookings: number;
  totalVolunteerHours: number;
  totalBeneficiaries: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        companiesRes,
        usersRes,
        experiencesRes,
        publishedRes,
        bookingsRes,
      ] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("experiences").select("id", { count: "exact", head: true }),
        supabase
          .from("experiences")
          .select("id", { count: "exact", head: true })
          .eq("status", "published"),
        supabase
          .from("bookings")
          .select(
            `
            id,
            status,
            experience_dates (
              volunteer_hours,
              beneficiaries_count,
              end_datetime
            )
          `
          )
          .in("status", ["confirmed", "completed"]),
      ]);

      // Calculate volunteer hours and beneficiaries from completed bookings
      let totalVolunteerHours = 0;
      let totalBeneficiaries = 0;
      const now = new Date();

      if (bookingsRes.data) {
        bookingsRes.data.forEach((booking: any) => {
          const endDate = booking.experience_dates?.end_datetime
            ? new Date(booking.experience_dates.end_datetime)
            : null;
          if (endDate && endDate < now) {
            totalVolunteerHours += booking.experience_dates?.volunteer_hours || 0;
            totalBeneficiaries += booking.experience_dates?.beneficiaries_count || 0;
          }
        });
      }

      setStats({
        totalCompanies: companiesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalExperiences: experiencesRes.count || 0,
        publishedExperiences: publishedRes.count || 0,
        totalBookings: bookingsRes.data?.length || 0,
        totalVolunteerHours,
        totalBeneficiaries,
      });
    } catch (error) {
      devLog.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Aziende",
      value: stats?.totalCompanies || 0,
      icon: Building2,
      color: "text-bravo-purple",
      bgColor: "bg-bravo-purple/10",
    },
    {
      label: "Utenti",
      value: stats?.totalUsers || 0,
      icon: Users,
      color: "text-bravo-purple",
      bgColor: "bg-bravo-purple/10",
    },
    {
      label: "Esperienze",
      value: stats?.publishedExperiences || 0,
      subLabel: `${stats?.totalExperiences || 0} totali`,
      icon: Calendar,
      color: "text-bravo-purple",
      bgColor: "bg-bravo-purple/10",
    },
    {
      label: "Prenotazioni",
      value: stats?.totalBookings || 0,
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Ore Volontariato",
      value: stats?.totalVolunteerHours || 0,
      icon: Clock,
      color: "text-bravo-yellow",
      bgColor: "bg-bravo-yellow/10",
    },
    {
      label: "Beneficiari",
      value: stats?.totalBeneficiaries || 0,
      icon: Heart,
      color: "text-bravo-pink",
      bgColor: "bg-bravo-pink/10",
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Panoramica globale della piattaforma Bravo!"
        />

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, index) => (
            <MetricCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconColor={stat.color}
              iconBgColor={stat.bgColor}
              subLabel={stat.subLabel}
              animationDelay={index * 0.1}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <section>
            <h2 className="text-base font-semibold text-foreground pb-3 mb-4 border-b border-border">Azioni Rapide</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/super-admin/companies"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Gestisci Aziende</span>
              </Link>
              <Link
                to="/super-admin/experiences"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Gestisci Esperienze</span>
              </Link>
              <Link
                to="/super-admin/assignments"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Assegna Esperienze</span>
              </Link>
              <Link
                to="/super-admin/users"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">Visualizza Utenti</span>
              </Link>
            </div>
          </section>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
}
