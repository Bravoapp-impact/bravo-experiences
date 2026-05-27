import { BarChart3, Users, TrendingUp, Clock, Activity, Calendar, Building2, MapPin, Star, ThumbsUp, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { HRLayout } from "@/components/layout/HRLayout";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/common/PageHeader";
import { PageSkeleton } from "@/components/common/skeletons/PageSkeleton";
import PageSection from "@/components/common/PageSection";
import { Card, CardContent } from "@/components/ui/card";
import { getSDGInfo } from "@/lib/sdg-data";
import { useCompanyImpact } from "@/hooks/queries/impact/useCompanyImpact";
import {
  useCompanyKpiBreakdown,
  type CompanyKpiRow,
} from "@/hooks/queries/impact/useCompanyKpiBreakdown";

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("it-IT");
  return value.toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

interface StatProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  delay?: number;
}

function StatCard({ label, value, hint, icon: Icon, iconColor, iconBg, delay = 0 }: StatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="border-border/50 h-full">
        <CardContent className="p-5">
          <div className={`inline-flex p-2.5 rounded-xl ${iconBg} mb-3`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <p className="text-2xl font-bold text-foreground leading-tight">
            {value}
          </p>
          <p className="text-[12px] text-muted-foreground mt-1">{label}</p>
          {hint && (
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">{hint}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function HRDashboard() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? undefined;

  const { data: impact, isLoading: impactLoading } = useCompanyImpact(companyId);
  const { data: kpiRows = [], isLoading: kpiLoading } =
    useCompanyKpiBreakdown(companyId);

  const loading = impactLoading || kpiLoading;

  if (loading) {
    return (
      <HRLayout>
        <PageSkeleton variant="dashboard" />
      </HRLayout>
    );
  }

  const hasData = !!impact && impact.total_participations > 0;

  // Group KPI rows by experience
  const kpisByExperience = new Map<
    string,
    { title: string; rows: CompanyKpiRow[] }
  >();
  for (const row of kpiRows) {
    const bucket = kpisByExperience.get(row.experience_id);
    if (bucket) bucket.rows.push(row);
    else
      kpisByExperience.set(row.experience_id, {
        title: row.experience_title,
        rows: [row],
      });
  }
  const kpiGroups = Array.from(kpisByExperience.values());

  return (
    <HRLayout>
      <div className="space-y-2">
        <PageHeader
          title="Report"
          icon={BarChart3}
          iconColor="text-rose-500"
        />

        {!hasData ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-10 text-center">
                <div className="mx-auto mb-4 inline-flex p-3 rounded-full bg-primary/10">
                  <Sprout className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-base font-semibold text-foreground mb-1">
                  Il programma è attivo
                </h2>
                <p className="text-[13px] text-muted-foreground max-w-md mx-auto">
                  L'impatto comparirà qui dopo le prime esperienze completate
                  dai partecipanti della tua azienda.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Coinvolgimento */}
            <PageSection title="Coinvolgimento">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatCard
                  label="Persone uniche coinvolte"
                  value={formatNumber(impact!.unique_participants)}
                  hint={`su ${formatNumber(impact!.registered_users)} utenti registrati`}
                  icon={Users}
                  iconColor="text-bravo-purple"
                  iconBg="bg-bravo-purple/10"
                  delay={0.05}
                />
                <StatCard
                  label="Tasso di partecipazione"
                  value={formatPercent(impact!.participation_rate)}
                  icon={TrendingUp}
                  iconColor="text-success"
                  iconBg="bg-success/10"
                  delay={0.1}
                />
                <StatCard
                  label="Ore totali di volontariato"
                  value={formatNumber(impact!.total_hours)}
                  icon={Clock}
                  iconColor="text-bravo-orange"
                  iconBg="bg-bravo-orange/10"
                  delay={0.15}
                />
                <StatCard
                  label="Ore medie per partecipante"
                  value={formatNumber(impact!.avg_hours_per_participant)}
                  icon={Activity}
                  iconColor="text-cyan-600"
                  iconBg="bg-cyan-500/10"
                  delay={0.2}
                />
                <StatCard
                  label="Partecipazioni totali"
                  value={formatNumber(impact!.total_participations)}
                  hint={`${formatNumber(impact!.distinct_experiences)} esperienze diverse`}
                  icon={Calendar}
                  iconColor="text-bravo-pink"
                  iconBg="bg-bravo-pink/10"
                  delay={0.25}
                />
              </div>
            </PageSection>

            {/* Impatto sul territorio */}
            <PageSection title="Impatto sul territorio">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                <StatCard
                  label="ETS coinvolti"
                  value={formatNumber(impact!.ets_count)}
                  icon={Building2}
                  iconColor="text-emerald-600"
                  iconBg="bg-emerald-500/10"
                />
                <StatCard
                  label="Città coperte"
                  value={formatNumber(impact!.cities_count)}
                  icon={MapPin}
                  iconColor="text-blue-600"
                  iconBg="bg-blue-500/10"
                />
              </div>

              {kpiGroups.length > 0 ? (
                <Card>
                  <CardContent className="p-5 space-y-5">
                    <p className="text-[13px] text-muted-foreground">
                      Risultati concreti raggiunti, per esperienza:
                    </p>
                    {kpiGroups.map((group, idx) => (
                      <motion.div
                        key={group.title + idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        className="border-l-2 border-primary/30 pl-4"
                      >
                        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          {group.title}
                        </p>
                        <ul className="space-y-2">
                          {group.rows.map((row) => (
                            <li
                              key={row.kpi_label}
                              className="flex items-baseline gap-3"
                            >
                              <span className="text-xl font-bold text-primary tabular-nums">
                                {formatNumber(row.total_value)}
                              </span>
                              <span className="text-sm text-foreground">
                                {row.kpi_label.toLowerCase()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-[13px] text-muted-foreground italic">
                  Nessun risultato specifico ancora registrato per le esperienze
                  completate.
                </p>
              )}
            </PageSection>

            {/* Aree di intervento */}
            <PageSection title="Aree di intervento">
              {impact!.sdgs_touched.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {impact!.sdgs_touched.map((code, index) => {
                    const info = getSDGInfo(code);
                    if (!info) return null;
                    return (
                      <motion.div
                        key={code}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.03 * index }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
                        style={{
                          backgroundColor: `${info.color}15`,
                          borderColor: `${info.color}30`,
                        }}
                      >
                        <span className="text-base leading-none">
                          {info.icon}
                        </span>
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
              ) : (
                <p className="text-[13px] text-muted-foreground italic">
                  Le aree di intervento appariranno qui dopo le prime
                  partecipazioni.
                </p>
              )}
            </PageSection>

            {/* Soddisfazione */}
            <PageSection
              title="Soddisfazione"
              description="Come i partecipanti valutano le esperienze"
            >
              {impact!.reviews_count > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <StatCard
                    label="Rating medio"
                    value={
                      impact!.avg_rating != null
                        ? `${impact!.avg_rating.toFixed(1)} / 5`
                        : "—"
                    }
                    hint={`${formatNumber(impact!.reviews_count)} ${impact!.reviews_count === 1 ? "recensione" : "recensioni"}`}
                    icon={Star}
                    iconColor="text-amber-500"
                    iconBg="bg-amber-500/10"
                  />
                  <StatCard
                    label="Consiglierebbero l'esperienza"
                    value={
                      impact!.would_recommend_rate != null
                        ? formatPercent(impact!.would_recommend_rate)
                        : "—"
                    }
                    icon={ThumbsUp}
                    iconColor="text-green-600"
                    iconBg="bg-green-500/10"
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-[13px] text-muted-foreground">
                      Nessuna recensione ancora raccolta. I feedback dei
                      partecipanti compariranno qui dopo le prime valutazioni.
                    </p>
                  </CardContent>
                </Card>
              )}
            </PageSection>
          </>
        )}
      </div>
    </HRLayout>
  );
}
