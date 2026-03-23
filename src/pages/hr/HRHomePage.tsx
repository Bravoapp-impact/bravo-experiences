import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { HRLayout } from "@/components/layout/HRLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Users,
  CalendarX,
  Sparkles,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Search,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";
import { LoadingState } from "@/components/common/LoadingState";
import { toast } from "@/hooks/use-toast";

interface UpcomingDate {
  id: string;
  start_datetime: string;
  end_datetime: string;
  max_participants: number;
  confirmed_count: number;
  experience: {
    title: string;
    city: string | null;
  };
}

interface QuickMetrics {
  employeesCount: number;
  totalVolunteerHours: number;
  participationRate: number;
}

export default function HRHomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [metrics, setMetrics] = useState<QuickMetrics>({ employeesCount: 0, totalVolunteerHours: 0, participationRate: 0 });
  const [aiInput, setAiInput] = useState("");

  const userName = profile?.first_name || "utente";

  const aiSuggestions = [
    { label: "Vedi chi si è iscritto", text: "Mostrami chi si è iscritto alle prossime iniziative", icon: Search },
    { label: "Report impatto", text: "Generami un report sull'impatto sociale dell'azienda", icon: BarChart3 },
    { label: "Prossime iniziative", text: "Quali sono le prossime iniziative in programma?", icon: CalendarDays },
  ];

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    toast({ title: "L'assistente AI Bravo! sarà disponibile a breve", description: "Stiamo lavorando per portarti questa funzionalità." });
    setAiInput("");
  };

  useEffect(() => {
    if (profile?.company_id) {
      Promise.all([fetchUpcomingDates(), fetchQuickMetrics()]).finally(() => setLoading(false));
    }
  }, [profile?.company_id]);

  const fetchUpcomingDates = async () => {
    if (!profile?.company_id) return;
    try {
      const now = new Date().toISOString();
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get experience IDs assigned to this company
      const { data: expCompanies } = await supabase
        .from("experience_companies")
        .select("experience_id")
        .eq("company_id", profile.company_id);

      const expIds = (expCompanies || []).map((ec) => ec.experience_id);
      if (expIds.length === 0) return;

      const { data: dates } = await supabase
        .from("experience_dates")
        .select("id, start_datetime, end_datetime, max_participants, experiences!inner(title, city)")
        .in("experience_id", expIds)
        .gt("start_datetime", now)
        .lt("start_datetime", weekLater)
        .order("start_datetime", { ascending: true })
        .limit(5);

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
          confirmedCountMap[b.experience_date_id] = (confirmedCountMap[b.experience_date_id] || 0) + 1;
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
            title: (date.experiences as any).title,
            city: (date.experiences as any).city,
          },
        }))
      );
    } catch (error) {
      devLog.error("Error fetching upcoming dates:", error);
    }
  };

  const fetchQuickMetrics = async () => {
    if (!profile?.company_id) return;
    try {
      const { data: companyProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", profile.company_id);

      const employeesCount = companyProfiles?.length || 0;
      const companyUserIds = (companyProfiles || []).map((p) => p.id);

      if (companyUserIds.length === 0) {
        setMetrics({ employeesCount, totalVolunteerHours: 0, participationRate: 0 });
        return;
      }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("user_id, status, experience_dates(end_datetime, volunteer_hours)")
        .in("user_id", companyUserIds)
        .limit(1000);

      const now = new Date();
      const completed = (bookingsData || []).filter(
        (b) => b.status === "completed" || (b.status === "confirmed" && b.experience_dates && new Date(b.experience_dates.end_datetime) < now)
      );

      const participatingEmployees = new Set(completed.map((b) => b.user_id));
      const participationRate = employeesCount > 0 ? Math.round((participatingEmployees.size / employeesCount) * 100) : 0;

      let totalVolunteerHours = 0;
      completed.forEach((b) => {
        totalVolunteerHours += Number(b.experience_dates?.volunteer_hours) || 0;
      });

      setMetrics({ employeesCount, totalVolunteerHours, participationRate });
    } catch (error) {
      devLog.error("Error fetching quick metrics:", error);
    }
  };

  if (loading) {
    return (
      <HRLayout>
        <LoadingState message="Caricamento..." />
      </HRLayout>
    );
  }

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: it });

  return (
    <HRLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Buongiorno, {userName}</h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">{today}</p>
        </motion.div>

        {/* AI Assistant Interface */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Sparkles className="h-3 w-3" />
              Assistente AI Bravo!
            </div>
            <div className="relative">
              <Textarea
                placeholder="Descrivi il progetto che vuoi realizzare..."
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => navigate("/hr/experiences")} className="gap-2">
            <Calendar className="h-4 w-4" />
            Esplora esperienze
          </Button>
          <Button variant="outline" onClick={() => navigate("/hr/users")} className="gap-2">
            <Users className="h-4 w-4" />
            Gestisci utenti
          </Button>
        </motion.div>

        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Initiatives */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border bg-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-primary" />
                    Prossime iniziative
                  </span>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => navigate("/hr/report")}>
                    Vedi tutte
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingDates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarX className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Nessuna iniziativa nei prossimi 7 giorni</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingDates.map((date) => (
                      <div key={date.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md border border-border/40 bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0 mb-2 sm:mb-0">
                          <p className="text-sm font-medium text-foreground truncate">{date.experience.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(date.start_datetime), "EEE d MMM · HH:mm", { locale: it })} – {format(new Date(date.end_datetime), "HH:mm")}
                            {date.experience.city && ` · ${date.experience.city}`}
                          </p>
                        </div>
                        <Badge variant={date.confirmed_count >= date.max_participants ? "destructive" : "secondary"} className="flex items-center gap-1 text-xs shrink-0">
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

          {/* Quick Summary */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border bg-card h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Riepilogo rapido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-md border border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Users className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Dipendenti</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{metrics.employeesCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md border border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Clock className="h-4 w-4 text-orange-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Ore volontariato</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{metrics.totalVolunteerHours.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md border border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Tasso partecipazione</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{metrics.participationRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </HRLayout>
  );
}
