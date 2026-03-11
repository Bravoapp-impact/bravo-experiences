import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Users, Award, TrendingUp, Sprout, MessageSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getSDGInfo } from "@/lib/sdg-data";
import { devLog } from "@/lib/logger";
import { useNavigate } from "react-router-dom";

interface ImpactStats {
  completedExperiences: number;
  totalVolunteerHours: number;
  totalBeneficiaries: number;
  sdgContributions: { code: string; hours: number }[];
}

export default function Impact() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchImpactStats();
      fetchPendingFeedback();
    }
  }, [user]);

  const fetchPendingFeedback = async () => {
    try {
      // Get past confirmed bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, experience_dates(start_datetime)")
        .eq("user_id", user?.id)
        .in("status", ["confirmed", "completed"]);

      const pastBookingIds = (bookings || [])
        .filter((b: any) => new Date(b.experience_dates?.start_datetime) < new Date())
        .map((b: any) => b.id);

      if (pastBookingIds.length === 0) {
        setPendingFeedbackCount(0);
        return;
      }

      // Check which have reviews
      const { data: reviews } = await supabase
        .from("experience_reviews" as any)
        .select("booking_id")
        .in("booking_id", pastBookingIds)
        .returns<{ booking_id: string }[]>();

      const reviewedIds = new Set((reviews || []).map((r) => r.booking_id));
      setPendingFeedbackCount(pastBookingIds.filter((id: string) => !reviewedIds.has(id)).length);
    } catch (error) {
      devLog.error("Error fetching pending feedback:", error);
    }
  };

  const fetchImpactStats = async () => {
    try {
      // Fetch completed bookings with experience details
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id,
          experience_dates (
            start_datetime,
            volunteer_hours,
            beneficiaries_count,
            experiences (
              title,
              sdgs
            )
          )
        `)
        .eq("user_id", user?.id)
        .eq("status", "confirmed");

      if (error) throw error;

      // Filter only past experiences
      const now = new Date();
      const completedBookings = (bookings || []).filter((booking) => {
        const startDate = new Date(booking.experience_dates?.start_datetime || "");
        return startDate < now;
      });

      // Calculate stats
      let totalHours = 0;
      let totalBeneficiaries = 0;
      const sdgHoursMap: Record<string, number> = {};

      completedBookings.forEach((booking) => {
        const date = booking.experience_dates;
        if (date) {
          const hours = Number(date.volunteer_hours) || 0;
          totalHours += hours;
          totalBeneficiaries += date.beneficiaries_count || 0;

          // Aggregate SDG contributions
          const sdgs = date.experiences?.sdgs || [];
          sdgs.forEach((sdg: string) => {
            sdgHoursMap[sdg] = (sdgHoursMap[sdg] || 0) + hours;
          });
        }
      });

      const sdgContributions = Object.entries(sdgHoursMap)
        .map(([code, hours]) => ({ code, hours }))
        .sort((a, b) => b.hours - a.hours);

      setStats({
        completedExperiences: completedBookings.length,
        totalVolunteerHours: totalHours,
        totalBeneficiaries,
        sdgContributions,
      });
    } catch (error) {
      devLog.error("Error fetching impact stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 pb-20 md:pb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-foreground"
          >
            Il tuo impatto
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[13px] text-muted-foreground mt-0.5"
          >
            Il contributo che stai dando al mondo
          </motion.p>
        </div>

        {/* Feedback Banner */}
        {pendingFeedbackCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate("/app/bookings")}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-left hover:bg-primary/15 transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Hai {pendingFeedbackCount} {pendingFeedbackCount === 1 ? "esperienza" : "esperienze"} da valutare
              </p>
              <p className="text-[12px] text-muted-foreground">
                Il tuo feedback ci aiuta a migliorare 💜
              </p>
            </div>
          </motion.button>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-bravo-purple/10">
                    <Award className="h-5 w-5 text-bravo-purple" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {stats?.completedExperiences || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Esperienze</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-bravo-orange/10">
                    <Clock className="h-5 w-5 text-bravo-orange" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {stats?.totalVolunteerHours || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Ore donate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-bravo-pink/10">
                    <Users className="h-5 w-5 text-bravo-pink" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {stats?.totalBeneficiaries || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Beneficiari</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-success/10">
                    <TrendingUp className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {stats?.sdgContributions?.length || 0}
                    </p>
                    <p className="text-[11px] text-muted-foreground">SDGs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* SDG Contributions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Contributo agli SDGs</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.sdgContributions && stats.sdgContributions.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {stats.sdgContributions.map((contribution, index) => {
                    const sdgInfo = getSDGInfo(contribution.code);
                    if (!sdgInfo) return null;

                    return (
                      <motion.div
                        key={contribution.code}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        className="flex flex-col items-center p-3 rounded-xl border"
                        style={{
                          backgroundColor: `${sdgInfo.color}15`,
                          borderColor: `${sdgInfo.color}30`,
                        }}
                      >
                        <span className="text-2xl mb-1">{sdgInfo.icon}</span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: sdgInfo.color }}
                        >
                          SDG {sdgInfo.code.split("_")[1]}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {contribution.hours}h
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sprout className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-[13px] font-medium">Nessun contributo ancora</p>
                  <p className="text-[12px] mt-0.5">
                    Partecipa alla tua prima esperienza per iniziare!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
