import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, MapPin, Tag, Eye, PackageOpen, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { BaseModal, ModalCloseButton } from "@/components/common/BaseModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/crud/DeleteConfirmDialog";
import { devLog } from "@/lib/logger";
import { getSDGInfo } from "@/lib/sdg-data";
import { CreateExperienceDialog } from "@/components/association/CreateExperienceDialog";
import { toast } from "sonner";

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
  category_id: string | null;
  city_id: string | null;
  participant_info: string | null;
  categories?: { id: string; name: string } | null;
  cities?: { id: string; name: string } | null;
}

export default function AssociationExperiencesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editExperience, setEditExperience] = useState<Experience | null>(null);
  const [deleteExperience, setDeleteExperience] = useState<Experience | null>(null);
  const [deleting, setDeleting] = useState(false);

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
        .select(`*, categories (id, name), cities (id, name)`)
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

  const handleDelete = async () => {
    if (!deleteExperience) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("experiences")
        .delete()
        .eq("id", deleteExperience.id);
      if (error) {
        devLog.error("Error deleting experience:", error);
        toast.error("Errore nell'eliminazione");
        return;
      }
      toast.success("Esperienza eliminata");
      setDeleteExperience(null);
      fetchExperiences();
    } catch (err) {
      devLog.error("Unexpected delete error:", err);
      toast.error("Errore imprevisto");
    } finally {
      setDeleting(false);
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

        {experiences.length === 0 ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <PackageOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Nessuna esperienza</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Non ci sono ancora esperienze associate alla tua organizzazione.
              </p>
            </CardContent>
          </Card>
        ) : (
          <TooltipProvider delayDuration={300}>
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

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setSelectedExperience(experience)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Anteprima</TooltipContent>
                        </Tooltip>

                        {experience.status === "draft" && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => setEditExperience(experience)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Modifica</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteExperience(experience)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Elimina</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>

      {/* Preview Modal */}
      <BaseModal open={!!selectedExperience} onClose={() => setSelectedExperience(null)}>
        {selectedExperience && (
          <div className="flex flex-col h-full sm:max-h-[85vh] overflow-hidden">
            <div className="absolute top-4 right-4 z-10">
              <ModalCloseButton onClick={() => setSelectedExperience(null)} />
            </div>
            <div className="flex-1 overflow-y-auto">
              {selectedExperience.image_url && (
                <AspectRatio ratio={16 / 9}>
                  <img src={selectedExperience.image_url} alt={selectedExperience.title} className="object-cover w-full h-full" />
                </AspectRatio>
              )}
              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(selectedExperience.status)}
                  {(selectedExperience.categories?.name || selectedExperience.category) && (
                    <Badge variant="outline">
                      {selectedExperience.categories?.name || selectedExperience.category}
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground leading-tight">{selectedExperience.title}</h2>
                {selectedExperience.description && (
                  <p className="text-[15px] text-muted-foreground font-light leading-relaxed whitespace-pre-wrap">
                    {selectedExperience.description}
                  </p>
                )}
                {(selectedExperience.cities?.name || selectedExperience.city || selectedExperience.address) && (
                  <div className="flex items-start gap-2 pt-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      {selectedExperience.address && `${selectedExperience.address}, `}
                      {selectedExperience.cities?.name || selectedExperience.city}
                    </p>
                  </div>
                )}
                {selectedExperience.sdgs && selectedExperience.sdgs.length > 0 && (
                  <div className="pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Obiettivi SDG</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedExperience.sdgs.map((sdg) => {
                        const sdgInfo = getSDGInfo(sdg);
                        return (
                          <Badge key={sdg} variant="secondary" className="text-xs" title={sdgInfo?.name}>
                            {sdg}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </BaseModal>

      {/* Create Dialog */}
      <CreateExperienceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={fetchExperiences}
      />

      {/* Edit Dialog */}
      <CreateExperienceDialog
        open={!!editExperience}
        onOpenChange={(open) => { if (!open) setEditExperience(null); }}
        onCreated={() => { setEditExperience(null); fetchExperiences(); }}
        experience={editExperience || undefined}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteExperience}
        onOpenChange={(open) => { if (!open) setDeleteExperience(null); }}
        onConfirm={handleDelete}
        entityName="esperienza"
        entityLabel={deleteExperience?.title}
        isLoading={deleting}
      />
    </AssociationLayout>
  );
}
