import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users, History, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";

interface PastDate {
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

export default function AssociationHistoryPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pastDates, setPastDates] = useState<PastDate[]>([]);

  useEffect(() => {
    if (profile?.association_id) {
      fetchPastDates();
    }
  }, [profile?.association_id]);

  const fetchPastDates = async () => {
    if (!profile?.association_id) return;

    try {
      setLoading(true);
      const now = new Date().toISOString();

      // Fetch past dates for this association's experiences
      const { data: dates, error } = await supabase
        .from("experience_dates")
        .select(`
          id,
          start_datetime,
          end_datetime,
          max_participants,
          experiences!inner (
            id,
            title,
            city,
            association_id
          )
        `)
        .eq("experiences.association_id", profile.association_id)
        .lt("end_datetime", now)
        .order("start_datetime", { ascending: false });

      if (error) {
        devLog.error("Error fetching past dates:", error);
        return;
      }

      // Get confirmed bookings count for each date
      const datesWithCounts = await Promise.all(
        (dates || []).map(async (date) => {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("experience_date_id", date.id)
            .eq("status", "confirmed");

          return {
            id: date.id,
            start_datetime: date.start_datetime,
            end_datetime: date.end_datetime,
            max_participants: date.max_participants,
            confirmed_count: count || 0,
            experience: {
              id: date.experiences.id,
              title: date.experiences.title,
              city: date.experiences.city,
            },
          };
        })
      );

      setPastDates(datesWithCounts);
    } catch (error) {
      devLog.error("Error in fetchPastDates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalParticipants = pastDates.reduce((sum, d) => sum + d.confirmed_count, 0);
  const totalEvents = pastDates.length;

  if (loading) {
    return (
      <AssociationLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Caricamento storico...</p>
          </div>
        </div>
      </AssociationLayout>
    );
  }

  return (
    <AssociationLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-xl font-bold text-foreground">Storico</h1>
          <p className="text-muted-foreground mt-1 text-[13px]">
            Le attività di volontariato completate
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <CalendarCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totalEvents}</p>
                  <p className="text-[13px] text-muted-foreground">Eventi completati</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totalParticipants}</p>
                  <p className="text-[13px] text-muted-foreground">Partecipanti totali</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Past Dates List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Date Passate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pastDates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-base font-medium text-foreground mb-1">
                    Nessuna attività completata
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Non ci sono ancora attività completate da mostrare nello storico.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastDates.map((date, index) => (
                    <motion.div
                      key={date.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-card"
                    >
                      <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                        <h4 className="font-medium text-foreground truncate">
                          {date.experience.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(date.start_datetime), "d MMMM yyyy", { locale: it })}
                          </span>
                          {date.experience.city && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">
                                {date.experience.city}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {date.confirmed_count} partecipanti
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AssociationLayout>
  );
}
