import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Clock, Settings, ChevronRight, Award } from "lucide-react";
import { AppBootSkeleton } from "@/components/common/skeletons/AppBootSkeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { useAuth } from "@/hooks/useAuth";
import { useHourBudget } from "@/hooks/useHourBudget";
import { supabase } from "@/integrations/supabase/client";
import { isPast } from "date-fns";

interface CompletedRow {
  id: string;
  status: string;
  experience_dates: {
    start_datetime: string;
    volunteer_hours?: number | null;
  };
}

export default function Profile() {
  const { profile, loading, signOut, refreshProfile } = useAuth();
  const { budgetHours, usedHours, isUnlimited, loading: budgetLoading } = useHourBudget();
  const navigate = useNavigate();

  const [completed, setCompleted] = useState<CompletedRow[]>([]);
  const [completedLoading, setCompletedLoading] = useState(true);

  // Redirect admin users to their specific profile pages
  useEffect(() => {
    if (!loading && profile) {
      const roleRoutes: Record<string, string> = {
        super_admin: "/super-admin/impostazioni/profilo",
        hr_admin: "/hr/impostazioni/profilo",
        association_admin: "/association/impostazioni/profilo",
      };

      if (profile.role && roleRoutes[profile.role]) {
        navigate(roleRoutes[profile.role], { replace: true });
      }
    }
  }, [profile, loading, navigate]);

  const fetchCompleted = async () => {
    if (!profile?.id) return;
    setCompletedLoading(true);
    try {
      const { data } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          experience_dates (
            start_datetime,
            volunteer_hours
          )
        `)
        .eq("user_id", profile.id);

      const valid = (data || []).filter((b: any) => b.experience_dates);

      const completedRows = valid.filter((b: any) => {
        if (b.status === "cancelled" || b.status === "no_show") return false;
        if (b.status === "completed") return true;
        if (b.status === "confirmed") {
          return isPast(new Date(b.experience_dates.start_datetime));
        }
        return false;
      });

      setCompleted(completedRows as CompletedRow[]);
    } finally {
      setCompletedLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, [profile?.id]);

  if (loading || (profile?.role && profile.role !== "employee")) {
    return <AppBootSkeleton role="employee" />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const completedCount = completed.length;
  const completedLabel =
    completedCount === 0
      ? "Nessuna esperienza"
      : completedCount === 1
      ? "1 esperienza"
      : `${completedCount} esperienze`;
  const companyName = profile?.companies?.name;


  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-foreground"
          >
            Profilo
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[13px] text-muted-foreground mt-1"
          >
            Il tuo percorso di volontariato
          </motion.p>
        </div>

        {/* FASCIA 1 — Identity Card (hero) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {profile?.id && (
                  <ProfileAvatarUpload
                    userId={profile.id}
                    avatarUrl={profile.avatar_url}
                    firstName={profile.first_name}
                    lastName={profile.last_name}
                    onUploadComplete={refreshProfile}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-foreground truncate">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  {companyName && (
                    <p className="text-[13px] text-muted-foreground truncate">{companyName}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tiles */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <Link to="/app/esperienze-completate" className="block group">
              <Card className="h-full transition-shadow group-hover:shadow-md group-active:scale-[0.98]">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-amber-500 shrink-0" />
                    {completedLoading ? (
                      <Skeleton className="h-7 w-10" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {completedCount}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    Esperienze completate
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.21 }}
          >
            <Link to="/app/impact" className="block group">
              <Card className="h-full transition-shadow group-hover:shadow-md group-active:scale-[0.98]">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-emerald-500 shrink-0" />
                    {completedLoading ? (
                      <Skeleton className="h-7 w-10" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {totalHoursLabel}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    Ore donate
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Hour budget — flat row */}
        {(budgetLoading || !isUnlimited) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="flex items-center gap-3 px-1"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              {budgetLoading ? (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      Ore disponibili quest'anno
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {usedHours} / {budgetHours}
                    </span>
                  </div>
                  <Progress
                    value={budgetHours > 0 ? (usedHours / budgetHours) * 100 : 0}
                    className="h-2"
                  />
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* FASCIA 3 — Settings (flat row) + Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.27 }}
        >
          <Link
            to="/app/impostazioni"
            className="flex items-center gap-3 px-1 py-3 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0">
              <Settings className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Impostazioni</p>
              <p className="text-xs text-muted-foreground">
                Profilo, sicurezza, notifiche
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Esci dall'account
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
