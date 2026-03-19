import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Users,
  CalendarX,
  Plus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileEdit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";
import { LoadingState } from "@/components/common/LoadingState";

interface UpcomingDate {
  id: string;
  start_datetime: string;
  end_datetime: string;
  max_participants: number;
  confirmed_count: number;
  experience: {
    id: string;
    title: string;
    city: string | null;
  };
}

interface DraftExperience {
  id: string;
  title: string;
  status: string;
}

export default function AssociationHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [drafts, setDrafts] = useState<DraftExperience[]>([]);

  const associationName =
    (profile?.associations as any)?.name || "Associazione";

  useEffect(() => {
    if (profile?.association_id) {
      Promise.all([fetchUpcomingDates(), fetchDrafts()]).finally(() =>
        setLoading(false)
      );
    }
  }, [profile?.association_id]);

  const fetchUpcomingDates = async () => {
    if (!profile?.association_id) return;
    try {
      const now = new Date().toISOString();
      const weekLater = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: dates, error } = await supabase
        .from("experience_dates")
        .select(
          `id, start_datetime, end_datetime, max_participants,
           experiences!inner (id, title, city, association_id)`
        )
        .eq("experiences.association_id", profile.association_id)
        .gt("start_datetime", now)
        .lt("start_datetime", weekLater)
        .order("start_datetime", { ascending: true })
        .limit(5);

      if (error) {
        devLog.error("Error fetching upcoming dates:", error);
        return;
      }

      const dateList = dates || [];
      const dateIds = dateList.map((d) => d.id);

      let confirmedCountMap: Record<string, number> = {};
      if (dateIds.length > 0) {
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("experience_date_id")
          .in("experience_date_id", dateIds)
          .eq("status", "confirmed");

        (bookingsData || []).forEach((b) => {
          confirmedCountMap[b.experience_date_id] =
            (confirmedCountMap[b.experience_date_id] || 0) + 1;
        });
      }

      setUpcomingDates(
        dateList.map((date) => ({
          id: date.id,
          start_datetime: date.start_datetime,
          end_datetime: date.end_datetime,
          max_participants: date.max_participants,
          confirmed_count: confirmedCountMap[date.id] || 0,
          experience: {
            id: (date.experiences as any).id,
            title: (date.experiences as any).title,
            city: (date.experiences as any).city,
          },
        }))
      );
    } catch (error) {
      devLog.error("Error in fetchUpcomingDates:", error);
    }
  };

  const fetchDrafts = async () => {
    if (!profile?.association_id) return;
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select("id, title, status")
        .eq("association_id", profile.association_id)
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (error) {
        devLog.error("Error fetching drafts:", error);
        return;
      }
      setDrafts(data || []);
    } catch (error) {
      devLog.error("Error in fetchDrafts:", error);
    }
  };

  if (loading) {
    return (
      <AssociationLayout>
        <LoadingState message="Caricamento..." />
      </AssociationLayout>
    );
  }

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: it });

  return (
    <AssociationLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-foreground">
            Buongiorno, {associationName}
          </h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {today}
          </p>
        </motion.div>

        {/* AI Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="rounded-lg border-2 border-dashed border-border/60 p-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Assistente AI Bravo!
              </p>
              <p className="text-xs text-muted-foreground">
                Coming Soon — Il tuo assistente intelligente per gestire
                esperienze, comunicazioni e report.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3"
        >
          <Button
            variant="outline"
            onClick={() => navigate("/association/experiences")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Crea esperienza
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/association/calendar")}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Vai al calendario
          </Button>
        </motion.div>

        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Activities */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border bg-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-primary" />
                    Prossime attività
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground gap-1"
                    onClick={() => navigate("/association/calendar")}
                  >
                    Vedi tutte
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarX className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nessuna attività nei prossimi 7 giorni
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDates.map((date) => (
                      <div
                        key={date.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {date.experience.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(
                              new Date(date.start_datetime),
                              "EEE d MMM · HH:mm",
                              { locale: it }
                            )}{" "}
                            –{" "}
                            {format(new Date(date.end_datetime), "HH:mm")}
                            {date.experience.city &&
                              ` · ${date.experience.city}`}
                          </p>
                        </div>
                        <Badge
                          variant={
                            date.confirmed_count >= date.max_participants
                              ? "destructive"
                              : "secondary"
                          }
                          className="flex items-center gap-1 text-xs shrink-0"
                        >
                          <Users className="h-3 w-3" />
                          {date.confirmed_count}/{date.max_participants}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* To manage */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border bg-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileEdit className="h-4 w-4 text-primary" />
                  Da gestire
                </CardTitle>
              </CardHeader>
              <CardContent>
                {drafts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-8 w-8 text-primary/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Tutto in ordine!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drafts.map((exp) => (
                      <div
                        key={exp.id}
                        onClick={() =>
                          navigate("/association/experiences")
                        }
                        className="flex items-center justify-between p-3 rounded-md border border-border/40 bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0 mr-3">
                          {exp.title}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          Bozza
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AssociationLayout>
  );
}
