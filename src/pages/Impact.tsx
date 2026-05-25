import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Award, Calendar, Sprout, MessageSquare, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getSDGInfo } from "@/lib/sdg-data";
import { devLog } from "@/lib/logger";
import { useUserImpact } from "@/hooks/queries/impact/useUserImpact";
import { useUserKpiContributions } from "@/hooks/queries/impact/useUserKpiContributions";

function formatNumber(value: number): string {
  // Compact display: integers without decimals, fractional with up to 1.
  if (Number.isInteger(value)) return value.toLocaleString("it-IT");
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function formatLastParticipation(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function Impact() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);

  const { data: impact, isLoading: impactLoading } = useUserImpact(user?.id);
  const { data: kpiRows = [], isLoading: kpiLoading } = useUserKpiContributions(
    user?.id,
  );

  useEffect(() => {
    if (user) fetchPendingFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPendingFeedback = async () => {
    try {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, experience_dates(start_datetime)")
        .eq("user_id", user?.id)
        .in("status", ["confirmed", "completed"]);

      const pastBookingIds = (bookings || [])
        .filter(
          (b: any) => new Date(b.experience_dates?.start_datetime) < new Date(),
        )
        .map((b: any) => b.id);

      if (pastBookingIds.length === 0) {
        setPendingFeedbackCount(0);
        return;
      }

      const { data: reviews } = await supabase
        .from("experience_reviews" as any)
        .select("booking_id")
        .in("booking_id", pastBookingIds)
        .returns<{ booking_id: string }[]>();

      const reviewedIds = new Set((reviews || []).map((r) => r.booking_id));
      setPendingFeedbackCount(
        pastBookingIds.filter((id: string) => !reviewedIds.has(id)).length,
      );
    } catch (error) {
      devLog.error("Error fetching pending feedback:", error);
    }
  };

  const loading = impactLoading || kpiLoading;

  // Aggregate KPI contributions by label so identical KPIs across experiences
  // merge into one storytelling headline (e.g. "240 pasti distribuiti").
  const kpiByLabel = new Map<string, number>();
  for (const row of kpiRows) {
    kpiByLabel.set(
      row.kpi_label,
      (kpiByLabel.get(row.kpi_label) ?? 0) + row.total_value,
    );
  }
  const kpiHeadlines = Array.from(kpiByLabel.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const totalHours = impact?.total_hours ?? 0;
  const totalParticipations = impact?.total_participations ?? 0;
  const distinctExperiences = impact?.distinct_experiences ?? 0;
  const sdgs = impact?.sdgs_touched ?? [];
  const lastParticipation = formatLastParticipation(
    impact?.last_participation_at ?? null,
  );

  const isEmpty = !loading && totalParticipations === 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 pb-20 md:pb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
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
            {isEmpty
              ? "Qui troverai il racconto di ciò che farai"
              : "Quello che hai fatto, e i risultati che ne sono nati"}
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
                Hai {pendingFeedbackCount}{" "}
                {pendingFeedbackCount === 1 ? "esperienza" : "esperienze"} da valutare
              </p>
              <p className="text-[12px] text-muted-foreground">
                Il tuo feedback ci aiuta a migliorare 💜
              </p>
            </div>
          </motion.button>
        )}

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 inline-flex p-3 rounded-full bg-primary/10">
                  <Sprout className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  Il tuo viaggio inizia qui
                </h2>
                <p className="text-[13px] text-muted-foreground max-w-xs mx-auto mb-5">
                  Non hai ancora completato nessuna esperienza. Partecipa alla prima
                  e inizia a costruire il tuo impatto.
                </p>
                <button
                  onClick={() => navigate("/app/experiences")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="h-4 w-4" />
                  Esplora le esperienze
                </button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Blocco 1 — I tuoi numeri */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">I tuoi numeri</h2>

              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border">
                    <CardContent className="p-4">
                      <div className="p-2 rounded-full bg-bravo-orange/10 inline-flex mb-2">
                        <Clock className="h-4 w-4 text-bravo-orange" />
                      </div>
                      <p className="text-xl font-bold text-foreground leading-tight">
                        {formatNumber(totalHours)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Ore donate
                      </p>
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
                      <div className="p-2 rounded-full bg-bravo-purple/10 inline-flex mb-2">
                        <Calendar className="h-4 w-4 text-bravo-purple" />
                      </div>
                      <p className="text-xl font-bold text-foreground leading-tight">
                        {formatNumber(totalParticipations)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {totalParticipations === 1 ? "Partecipazione" : "Partecipazioni"}
                      </p>
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
                      <div className="p-2 rounded-full bg-bravo-pink/10 inline-flex mb-2">
                        <Award className="h-4 w-4 text-bravo-pink" />
                      </div>
                      <p className="text-xl font-bold text-foreground leading-tight">
                        {formatNumber(distinctExperiences)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {distinctExperiences === 1 ? "Esperienza" : "Esperienze"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {lastParticipation && (
                <p className="text-[12px] text-muted-foreground pl-1">
                  Ultima partecipazione il {lastParticipation}
                </p>
              )}
            </section>

            {/* Blocco 2 — I risultati a cui hai contribuito */}
            {kpiHeadlines.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-3"
              >
                <h2 className="text-sm font-semibold text-foreground">
                  I risultati a cui hai contribuito
                </h2>
                <Card>
                  <CardContent className="p-5">
                    <p className="text-[13px] text-muted-foreground mb-4">
                      Le attività a cui hai partecipato hanno prodotto, insieme:
                    </p>
                    <ul className="space-y-3">
                      {kpiHeadlines.map((kpi, index) => (
                        <motion.li
                          key={kpi.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="flex items-baseline gap-3"
                        >
                          <span className="text-2xl font-bold text-primary tabular-nums">
                            {formatNumber(kpi.value)}
                          </span>
                          <span className="text-sm text-foreground">
                            {kpi.label.toLowerCase()}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.section>
            )}

            {/* Blocco 3 — Le aree del tuo impatto */}
            {sdgs.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-3"
              >
                <h2 className="text-sm font-semibold text-foreground">
                  Le aree del tuo impatto
                </h2>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[13px] font-normal text-muted-foreground">
                      I temi dell'Agenda 2030 su cui hai agito
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {sdgs.map((code, index) => {
                        const info = getSDGInfo(code);
                        if (!info) return null;
                        return (
                          <motion.div
                            key={code}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.04 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                            style={{
                              backgroundColor: `${info.color}15`,
                              borderColor: `${info.color}30`,
                            }}
                          >
                            <span className="text-base leading-none">{info.icon}</span>
                            <span
                              className="text-xs font-medium"
                              style={{ color: info.color }}
                            >
                              {info.name}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
