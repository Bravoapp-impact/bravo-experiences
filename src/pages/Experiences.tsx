import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExperienceSection } from "@/components/experiences/ExperienceSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useEmployeeCatalog } from "@/hooks/queries/experiences/useEmployeeCatalog";

export default function Experiences() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: experiences = [], isLoading: loading } = useEmployeeCatalog(user?.id);

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
          />
        </div>
      )}
    </AppLayout>
  );
}
