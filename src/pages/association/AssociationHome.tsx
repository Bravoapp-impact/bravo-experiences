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
  ArrowUp,
  BarChart3,
  CalendarDays,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";
import { PageSkeleton } from "@/components/common/skeletons/PageSkeleton";
import { toast } from "@/hooks/use-toast";

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
  const [aiInput, setAiInput] = useState("");

  const aiSuggestions = [
    { label: "Riepilogo prenotazioni", text: "Fammi un riepilogo delle prenotazioni di questa settimana", icon: BarChart3 },
    { label: "Prossimi eventi", text: "Quali sono i prossimi eventi in programma?", icon: CalendarDays },
    { label: "Nuova esperienza", text: "Aiutami a creare una nuova esperienza di volontariato", icon: Plus },
  ];

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    toast({ title: "L'assistente AI Bravo! sarà disponibile a breve", description: "Stiamo lavorando per portarti questa funzionalità." });
    setAiInput("");
  };

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
        <PageSkeleton variant="dashboard" />
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

        {/* AI Assistant Interface */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Sparkles className="h-3 w-3" />
              Assistente AI Bravo!
            </div>
            <div className="relative">
              <Textarea
                placeholder="Descrivi il progetto che vuoi proporre alle aziende..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSend();
                  }
                }}
                className="min-h-[80px] resize-none rounded-lg border-border/60 bg-background pr-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
              />
              <button
                onClick={handleAiSend}
                disabled={!aiInput.trim()}
                className="absolute bottom-2.5 right-2.5 h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-opacity disabled:opacity-30 hover:opacity-90"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setAiInput(s.text)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <s.icon className="h-3 w-3" />
                  {s.label}
                </button>
              ))}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8 pt-2 border-t border-border">
          {/* Upcoming Activities */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                Prossime attività
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground gap-1 h-7"
                onClick={() => navigate("/association/calendar")}
              >
                Vedi tutte
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            {upcomingDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarX className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nessuna attività nei prossimi 7 giorni
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingDates.map((date) => (
                  <li
                    key={date.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 first:pt-0 last:pb-0"
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
                  </li>
                ))}
              </ul>
            )}
          </motion.section>

          {/* To manage */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border">
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <FileEdit className="h-4 w-4 text-primary" />
                Da gestire
              </h2>
            </div>
            {drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-primary/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Tutto in ordine!
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {drafts.map((exp) => (
                  <li
                    key={exp.id}
                    onClick={() => navigate("/association/experiences")}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0 mr-3">
                      {exp.title}
                    </p>
                    <Badge variant="outline" className="text-xs shrink-0">
                      Bozza
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        </div>
      </div>
    </AssociationLayout>
  );
}
