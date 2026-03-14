import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Eye, PackageOpen, Plus, Pencil, Trash2, FileText, CheckCircle2, Archive, ChevronRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { BaseModal, ModalCloseButton } from "@/components/common/BaseModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/crud/DeleteConfirmDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { devLog } from "@/lib/logger";
import { getSDGInfo } from "@/lib/sdg-data";
import { CreateExperienceDialog } from "@/components/association/CreateExperienceDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ManageDatesDialog } from "@/components/association/ManageDatesDialog";

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
  const [publishExperience, setPublishExperience] = useState<Experience | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [manageDatesExperience, setManageDatesExperience] = useState<Experience | null>(null);

  const grouped = useMemo(() => ({
    draft: experiences.filter(e => e.status === "draft"),
    published: experiences.filter(e => e.status === "published"),
    archived: experiences.filter(e => e.status === "archived"),
  }), [experiences]);

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

  const checkCanDelete = async (expId: string): Promise<boolean> => {
    // Check future dates
    const { count: futureDates } = await supabase
      .from("experience_dates")
      .select("id", { count: "exact", head: true })
      .eq("experience_id", expId)
      .gte("start_datetime", new Date().toISOString());

    if (futureDates && futureDates > 0) {
      toast.error("Non puoi eliminare un'esperienza con date future programmate");
      return false;
    }

    // Check active bookings on any dates
    const { data: dateIds } = await supabase
      .from("experience_dates")
      .select("id")
      .eq("experience_id", expId);

    if (dateIds && dateIds.length > 0) {
      const { count: activeBookings } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("experience_date_id", dateIds.map(d => d.id))
        .eq("status", "confirmed");

      if (activeBookings && activeBookings > 0) {
        toast.error("Non puoi eliminare un'esperienza con prenotazioni attive");
        return false;
      }
    }
    return true;
  };

  const handleDeleteRequest = async (exp: Experience) => {
    const canDelete = await checkCanDelete(exp.id);
    if (canDelete) {
      setDeleteExperience(exp);
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

  const handlePublish = async () => {
    if (!publishExperience) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from("experiences")
        .update({ status: "published" })
        .eq("id", publishExperience.id);
      if (error) {
        devLog.error("Error publishing experience:", error);
        toast.error("Errore nella pubblicazione");
        return;
      }
      toast.success("Esperienza pubblicata!");
      setPublishExperience(null);
      fetchExperiences();
    } catch (err) {
      devLog.error("Unexpected publish error:", err);
      toast.error("Errore imprevisto");
    } finally {
      setPublishing(false);
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

  const hasAny = experiences.length > 0;

  return (
    <AssociationLayout>
      <div className="space-y-6">
        {/* Page header */}
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

        {!hasAny ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">Nessuna esperienza</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Non ci sono ancora esperienze associate alla tua organizzazione.
            </p>
          </div>
        ) : (
          <TooltipProvider delayDuration={300}>
            <div className="space-y-8">
              {/* DRAFT */}
              {grouped.draft.length > 0 && (
                <StatusSection
                  icon={<FileText className="h-4 w-4" />}
                  title="Bozze"
                  count={grouped.draft.length}
                  iconClassName="text-muted-foreground"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {grouped.draft.map((exp, i) => (
                      <ExperienceCompactCard
                        key={exp.id}
                        experience={exp}
                        index={i}
                        onPreview={setSelectedExperience}
                        actions={
                          <div className="flex items-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600" onClick={() => setPublishExperience(exp)}>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Pubblica</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setSelectedExperience(exp)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Anteprima</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditExperience(exp)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Modifica</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteExperience(exp)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Elimina</TooltipContent>
                            </Tooltip>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </StatusSection>
              )}

              {/* PUBLISHED */}
              {grouped.published.length > 0 && (
                <StatusSection
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  title="Pubblicate"
                  count={grouped.published.length}
                  iconClassName="text-green-500"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {grouped.published.map((exp, i) => (
                      <ExperienceCompactCard
                        key={exp.id}
                        experience={exp}
                        index={i}
                        onPreview={setSelectedExperience}
                        actions={
                          <div className="flex items-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setManageDatesExperience(exp)}>
                                  <Calendar className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Gestisci date</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setSelectedExperience(exp)}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Anteprima</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setEditExperience(exp)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Modifica</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRequest(exp)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Elimina</TooltipContent>
                            </Tooltip>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </StatusSection>
              )}

              {/* ARCHIVED */}
              {grouped.archived.length > 0 && (
                <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors">
                      <Archive className="h-4 w-4" />
                      <span className="text-sm font-medium">Archiviate ({grouped.archived.length})</span>
                      <ChevronRight className={cn("h-4 w-4 ml-auto transition-transform", archivedOpen && "rotate-90")} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-3 space-y-1.5 pl-2">
                      {grouped.archived.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedExperience(exp)}
                        >
                          <span className="text-sm text-muted-foreground">{exp.title}</span>
                          <Eye className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
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

      {/* Publish Confirm */}
      <AlertDialog open={!!publishExperience} onOpenChange={(open) => { if (!open) setPublishExperience(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pubblica esperienza</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro? L'esperienza sarà visibile ai dipendenti delle aziende associate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={publishing}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Pubblicazione...
                </>
              ) : (
                "Pubblica"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Dates Dialog */}
      {manageDatesExperience && (
        <ManageDatesDialog
          open={!!manageDatesExperience}
          onOpenChange={(o) => { if (!o) setManageDatesExperience(null); }}
          experienceId={manageDatesExperience.id}
          experienceTitle={manageDatesExperience.title}
          defaultMaxParticipants={null}
        />
      )}
    </AssociationLayout>
  );
}

/* ── Sub-components ── */

function StatusSection({ icon, title, count, iconClassName, children }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  iconClassName: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex items-center gap-2.5 px-1 py-2 mb-4">
        <span className={cn("flex-shrink-0", iconClassName)}>{icon}</span>
        <span className="text-sm font-medium text-foreground">{title} ({count})</span>
      </div>
      {children}
    </motion.div>
  );
}

function ExperienceCompactCard({ experience, index, onPreview, actions }: {
  experience: Experience;
  index: number;
  onPreview: (e: Experience) => void;
  actions: React.ReactNode;
}) {
  const categoryName = experience.categories?.name || experience.category;
  const cityName = experience.cities?.name || experience.city;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="group"
    >
      <BaseCardImage
        imageUrl={experience.image_url}
        alt={experience.title}
        aspectRatio="square"
      />
      <div className="pt-2 space-y-1">
        <h3 className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug">
          {experience.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
          {categoryName && <span className="truncate">{categoryName}</span>}
          {categoryName && cityName && <span>·</span>}
          {cityName && (
            <span className="flex items-center gap-0.5 truncate">
              <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
              {cityName}
            </span>
          )}
        </div>
        <div className="pt-0.5">{actions}</div>
      </div>
    </motion.div>
  );
}
