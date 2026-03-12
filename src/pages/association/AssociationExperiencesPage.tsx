import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, MapPin, Tag, Eye, PackageOpen, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { devLog } from "@/lib/logger";
import { getSDGInfo } from "@/lib/sdg-data";
import { CreateExperienceDialog } from "@/components/association/CreateExperienceDialog";

interface Experience {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  city: string | null;
  address: string | null;
  status: string;
  sdgs: string[] | null;
  category: string | null;
  categories?: {
    id: string;
    name: string;
  } | null;
  cities?: {
    id: string;
    name: string;
  } | null;
}

export default function AssociationExperiencesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (profile?.association_id) {
      fetchExperiences();
    }
  }, [profile?.association_id]);

  const fetchExperiences = async () => {
    if (!profile?.association_id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("experiences")
        .select(`
          *,
          categories (id, name),
          cities (id, name)
        `)
        .eq("association_id", profile.association_id)
        .order("created_at", { ascending: false });

      if (error) {
        devLog.error("Error fetching experiences:", error);
        return;
      }

      setExperiences(data || []);
    } catch (error) {
      devLog.error("Error in fetchExperiences:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Pubblicata</Badge>;
      case "draft":
        return <Badge variant="secondary">Bozza</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AssociationLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Caricamento esperienze...</p>
          </div>
        </div>
      </AssociationLayout>
    );
  }

  return (
    <AssociationLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-xl font-bold text-foreground">Esperienze</h1>
            <p className="text-muted-foreground mt-1 text-[13px]">
              Le esperienze di volontariato gestite dalla tua associazione
            </p>
          </div>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Crea esperienza</span>
            <span className="sm:hidden">Crea</span>
          </Button>
        </motion.div>

        {/* Experiences Grid */}
        {experiences.length === 0 ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nessuna esperienza
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Non ci sono ancora esperienze associate alla tua organizzazione.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {experiences.map((experience, index) => (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                  <AspectRatio ratio={16 / 9}>
                    {experience.image_url ? (
                      <img
                        src={experience.image_url}
                        alt={experience.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </AspectRatio>
                  <CardContent className="flex-1 p-4 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-foreground line-clamp-2 flex-1">
                        {experience.title}
                      </h3>
                      {getStatusBadge(experience.status)}
                    </div>
                    
                    <div className="space-y-1.5 mb-4 flex-1">
                      {(experience.cities?.name || experience.city) && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{experience.cities?.name || experience.city}</span>
                        </div>
                      )}
                      {(experience.categories?.name || experience.category) && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Tag className="h-3.5 w-3.5" />
                          <span>{experience.categories?.name || experience.category}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedExperience(experience)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizza dettagli
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Experience Detail Dialog */}
      <Dialog open={!!selectedExperience} onOpenChange={() => setSelectedExperience(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedExperience?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {selectedExperience?.image_url && (
                <AspectRatio ratio={16 / 9} className="rounded-lg overflow-hidden">
                  <img
                    src={selectedExperience.image_url}
                    alt={selectedExperience.title}
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              )}

              <div className="flex flex-wrap gap-2">
                {getStatusBadge(selectedExperience?.status || "")}
                {(selectedExperience?.categories?.name || selectedExperience?.category) && (
                  <Badge variant="outline">
                    {selectedExperience?.categories?.name || selectedExperience?.category}
                  </Badge>
                )}
              </div>

              {selectedExperience?.description && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Descrizione</h4>
                  <p className="text-foreground whitespace-pre-wrap">{selectedExperience.description}</p>
                </div>
              )}

              {(selectedExperience?.cities?.name || selectedExperience?.city || selectedExperience?.address) && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Luogo</h4>
                  <p className="text-foreground">
                    {selectedExperience?.address && `${selectedExperience.address}, `}
                    {selectedExperience?.cities?.name || selectedExperience?.city}
                  </p>
                </div>
              )}

              {selectedExperience?.sdgs && selectedExperience.sdgs.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Obiettivi SDG</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExperience.sdgs.map((sdg) => {
                      const sdgInfo = getSDGInfo(sdg);
                      return (
                        <Badge
                          key={sdg}
                          variant="secondary"
                          className="text-xs"
                          title={sdgInfo?.name}
                        >
                          {sdg}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AssociationLayout>
  );
}
