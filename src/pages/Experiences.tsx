import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExperienceSection } from "@/components/experiences/ExperienceSection";
import { ExperienceDetailModal } from "@/components/experiences/ExperienceDetailModal";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { devLog } from "@/lib/logger";
import type { Experience, ExperienceDate } from "@/types/experiences";

interface ExperienceDateRow extends ExperienceDate {
  experience_id: string;
}

export default function Experiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const { budgetHours, usedHours, remainingHours, isUnlimited, loading: budgetLoading } = useHourBudget();

  const fetchExperiences = async () => {
    setLoading(true);

    try {
      // Fetch experiences with association details (RLS filters to user's company)
      const { data: expData, error: expError } = await supabase
        .from("experiences")
        .select(
          `
          *,
          associations:association_id (
            name,
            logo_url
          )
        `,
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (expError) throw expError;

      // Transform to include association logo and SDGs
      const baseExperiences = (expData ?? []).map((exp: any) => ({
        id: exp.id,
        title: exp.title,
        description: exp.description,
        image_url: exp.image_url,
        association_name: exp.associations?.name ?? exp.association_name,
        association_logo_url: exp.associations?.logo_url ?? null,
        city: exp.city,
        address: exp.address,
        category: exp.category,
        sdgs: exp.sdgs ?? [],
        participant_info: exp.participant_info ?? null,
      })) as Experience[];

      if (baseExperiences.length === 0) {
        setExperiences([]);
        return;
      }

      // Fetch dates separately to ensure date-level RLS is applied (company isolation)
      const experienceIds = baseExperiences.map((e) => e.id);
      const { data: datesData, error: datesError } = await supabase
        .from("experience_dates")
        .select("id, experience_id, start_datetime, end_datetime, max_participants")
        .in("experience_id", experienceIds)
        .gte("start_datetime", new Date().toISOString())
        .order("start_datetime", { ascending: true });

      if (datesError) throw datesError;

      const datesByExperienceId = new Map<string, ExperienceDate[]>();
      (datesData as ExperienceDateRow[] | null)?.forEach((d) => {
        const { experience_id, ...date } = d;
        const list = datesByExperienceId.get(experience_id) ?? [];
        list.push(date);
        datesByExperienceId.set(experience_id, list);
      });

      const experiencesWithDates = baseExperiences
        .map((exp) => ({
          ...exp,
          experience_dates: datesByExperienceId.get(exp.id) ?? [],
        }))
        .filter((exp) => exp.experience_dates.length > 0);

      setExperiences(experiencesWithDates);
    } catch (error) {
      devLog.error("Error fetching experiences:", error);
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, []);

  const filteredExperiences = experiences.filter(
    (exp) =>
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <AppLayout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-xl font-bold text-foreground mb-0.5">Esperienze sociali ad alto impatto positivo</h1>
        <p className="text-[13px] text-muted-foreground">Scopri le opportunità disponibili per la tua azienda</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cerca per titolo, città o categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-[13px]"
          />
        </div>
      </motion.div>

      {/* Hour budget widget */}
      {!budgetLoading && !isUnlimited && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Ore utilizzate</span>
                <span className="text-xs font-medium text-foreground">{usedHours} / {budgetHours}</span>
              </div>
              <Progress value={budgetHours > 0 ? (usedHours / budgetHours) * 100 : 0} className="h-2" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px] md:w-[200px] space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      ) : experiences.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🌱</p>
          <h3 className="text-base font-semibold mb-1">Nessuna esperienza disponibile</h3>
          <p className="text-[13px] text-muted-foreground">
            Non ci sono ancora esperienze disponibili per la tua azienda. Torna presto!
          </p>
        </div>
      ) : filteredExperiences.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="text-base font-semibold mb-1">Nessuna esperienza trovata</h3>
          <p className="text-[13px] text-muted-foreground">Prova a modificare i criteri di ricerca</p>
        </div>
      ) : (
        <div className="space-y-8">
          <ExperienceSection
            title="Esperienze disponibili"
            experiences={filteredExperiences}
            onSelectExperience={setSelectedExperience}
          />
        </div>
      )}

      {/* Detail Modal */}
      {selectedExperience && (
        <ExperienceDetailModal
          experience={selectedExperience}
          onClose={() => setSelectedExperience(null)}
          onBookingComplete={fetchExperiences}
        />
      )}
    </AppLayout>
  );
}
