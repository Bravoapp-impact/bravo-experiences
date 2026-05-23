import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Clock, Settings, ChevronRight, ArrowRight } from "lucide-react";
import { AppBootSkeleton } from "@/components/common/skeletons/AppBootSkeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import {
  CompletedExperienceCard,
  CompletedExperienceBooking,
  CompletedExperienceReview,
} from "@/components/experiences/CompletedExperienceCard";
import { BookingDetailModal } from "@/components/bookings/BookingDetailModal";
import { FeedbackModal } from "@/components/bookings/FeedbackModal";
import { useAuth } from "@/hooks/useAuth";
import { useHourBudget } from "@/hooks/useHourBudget";
import { supabase } from "@/integrations/supabase/client";
import { isPast } from "date-fns";

interface CompletedRow extends CompletedExperienceBooking {
  experience_dates: CompletedExperienceBooking["experience_dates"] & {
    volunteer_hours?: number | null;
  };
}

export default function Profile() {
  const { profile, loading, signOut, refreshProfile } = useAuth();
  const { budgetHours, usedHours, isUnlimited, loading: budgetLoading } = useHourBudget();
  const navigate = useNavigate();

  const [completed, setCompleted] = useState<CompletedRow[]>([]);
  const [reviews, setReviews] = useState<Map<string, CompletedExperienceReview>>(new Map());
  const [completedLoading, setCompletedLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<CompletedExperienceBooking | null>(null);
  const [feedbackBooking, setFeedbackBooking] = useState<CompletedExperienceBooking | null>(null);

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
          created_at,
          experience_dates (
            id,
            start_datetime,
            end_datetime,
            volunteer_hours,
            experiences (
              id,
              title,
              image_url,
              association_name,
              association_id,
              city,
              address,
              category,
              participant_info
            )
          )
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      const valid = (data || []).filter(
        (b: any) => b.experience_dates && b.experience_dates.experiences
      );

      const assocIds = Array.from(
        new Set(
          valid
            .map((b: any) => b.experience_dates.experiences.association_id)
            .filter((id: string | null): id is string => !!id)
        )
      );
      const assocMap = new Map<string, { name: string; logo_url: string | null }>();
      if (assocIds.length > 0) {
        const { data: assocs } = await supabase
          .from("associations_public" as any)
          .select("id, name, logo_url")
          .in("id", assocIds)
          .returns<{ id: string; name: string; logo_url: string | null }[]>();
        (assocs || []).forEach((a) => assocMap.set(a.id, { name: a.name, logo_url: a.logo_url }));
      }

      const hydrated = valid.map((b: any) => {
        const exp = b.experience_dates.experiences;
        const fromView = exp.association_id ? assocMap.get(exp.association_id) : undefined;
        return {
          ...b,
          experience_dates: {
            ...b.experience_dates,
            experiences: {
              ...exp,
              association_name: fromView?.name || exp.association_name,
              association_logo_url: fromView?.logo_url || null,
            },
          },
        };
      });

      const completedRows = hydrated
        .filter((b: any) => {
          if (b.status === "cancelled" || b.status === "no_show") return false;
          if (b.status === "completed") return true;
          if (b.status === "confirmed") {
            return isPast(new Date(b.experience_dates.start_datetime));
          }
          return false;
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.experience_dates.start_datetime).getTime() -
            new Date(a.experience_dates.start_datetime).getTime()
        );

      setCompleted(completedRows as CompletedRow[]);
    } finally {
      setCompletedLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from("experience_reviews" as any)
      .select("booking_id, rating, feedback_positive_tags")
      .returns<{ booking_id: string; rating: number; feedback_positive_tags: string[] }[]>();

    const map = new Map<string, CompletedExperienceReview>();
    (data || []).forEach((r) =>
      map.set(r.booking_id, {
        rating: r.rating,
        feedback_positive_tags: r.feedback_positive_tags || [],
      })
    );
    setReviews(map);
  };

  useEffect(() => {
    fetchCompleted();
    fetchReviews();
  }, [profile?.id]);

  if (loading || (profile?.role && profile.role !== "employee")) {
    return <AppBootSkeleton role="employee" />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleFeedbackSubmitted = () => {
    setFeedbackBooking(null);
    fetchReviews();
  };

  const completedCount = completed.length;
  const totalHours = completed.reduce(
    (sum, b) => sum + Number(b.experience_dates.volunteer_hours || 0),
    0
  );
  const totalHoursLabel = Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1);
  const previewCompleted = completed.slice(0, 3);
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

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border/60">
                <div>
                  {completedLoading ? (
                    <Skeleton className="h-7 w-10 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground leading-none">
                      {completedCount}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wide">
                    Esperienze completate
                  </p>
                </div>
                <div>
                  {completedLoading ? (
                    <Skeleton className="h-7 w-10 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground leading-none">
                      {totalHoursLabel}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1.5 uppercase tracking-wide">
                    Ore donate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hour budget — flat row */}
        {(budgetLoading || !isUnlimited) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
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

        {/* FASCIA 2 — Completed experiences preview */}
        {(completedLoading || completed.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-baseline justify-between mb-3 px-1">
              <h2 className="text-base font-semibold text-foreground">
                Esperienze completate
              </h2>
              {completed.length > 3 && (
                <Link
                  to="/app/esperienze-completate"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                >
                  Vedi tutte
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {completedLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {previewCompleted.map((b, i) => (
                  <CompletedExperienceCard
                    key={b.id}
                    booking={b}
                    review={reviews.get(b.id)}
                    index={i}
                    onOpen={setSelectedBooking}
                    onLeaveFeedback={setFeedbackBooking}
                  />
                ))}
                {completed.length > 3 && (
                  <Link
                    to="/app/esperienze-completate"
                    className="block text-center text-[13px] font-medium text-primary py-2 hover:underline"
                  >
                    Vedi tutte ({completed.length})
                  </Link>
                )}
              </div>
            )}
          </motion.section>
        )}

        {/* FASCIA 3 — Settings (flat row) + Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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

      <BookingDetailModal
        booking={selectedBooking as any}
        onClose={() => setSelectedBooking(null)}
        onCancel={() => {}}
        isCancelling={false}
      />

      <FeedbackModal
        open={!!feedbackBooking}
        onClose={() => setFeedbackBooking(null)}
        onSubmitted={handleFeedbackSubmitted}
        booking={feedbackBooking as any}
      />
    </AppLayout>
  );
}
