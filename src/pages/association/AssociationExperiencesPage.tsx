import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, MapPin, PackageOpen, Plus, Pencil, Trash2, FileText,
  CheckCircle2, Archive, ChevronRight, Calendar, Send, Copy, MoreHorizontal,
} from "lucide-react";
import { PageSkeleton } from "@/components/common/skeletons/PageSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BravoCard, BravoCardMetaItem } from "@/components/common/BravoCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/crud/DeleteConfirmDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { devLog } from "@/lib/logger";
import { CreateExperienceDialog } from "@/components/association/CreateExperienceDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ManageDatesDialog } from "@/components/association/ManageDatesDialog";
import { useIsMobile } from "@/hooks/use-mobile";

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
  max_participants: number | null;
  association_id: string | null;
  association_name: string | null;
  type: string;
  visibility: string;
  categories?: { id: string; name: string } | null;
  cities?: { id: string; name: string } | null;
  _hasBookings?: boolean;
}

export default function AssociationExperiencesPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editExperience, setEditExperience] = useState<Experience | null>(null);
  const [deleteExperience, setDeleteExperience] = useState<Experience | null>(null);
  const [deleteDescription, setDeleteDescription] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [publishExperience, setPublishExperience] = useState<Experience | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [archiveExperience, setArchiveExperience] = useState<Experience | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [manageDatesExperience, setManageDatesExperience] = useState<Experience | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

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
      setExperiences((data || []) as Experience[]);
    } catch (error) {
      devLog.error("Error in fetchExperiences:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if archived experience has any bookings (for delete eligibility)
  const checkHasBookings = useCallback(async (expId: string): Promise<boolean> => {
    const { data: dateIds } = await supabase
      .from("experience_dates")
      .select("id")
      .eq("experience_id", expId);

    if (!dateIds || dateIds.length === 0) return false;

    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .in("experience_date_id", dateIds.map(d => d.id));

    return (count ?? 0) > 0;
  }, []);

  // When archived section opens, check booking status for each archived experience
  useEffect(() => {
    if (!archivedOpen || grouped.archived.length === 0) return;

    const checkAll = async () => {
      const updates = await Promise.all(
        grouped.archived.map(async (exp) => {
          if (exp._hasBookings !== undefined) return exp;
          const hasBookings = await checkHasBookings(exp.id);
          return { ...exp, _hasBookings: hasBookings };
        })
      );
      setExperiences(prev =>
        prev.map(e => {
          const updated = updates.find(u => u.id === e.id);
          return updated ?? e;
        })
      );
    };
    checkAll();
  }, [archivedOpen, grouped.archived.length]);

  // Check if a published experience can be archived (no future dates with confirmed bookings)
  const checkCanArchive = async (expId: string): Promise<boolean> => {
    const { count: futureDates } = await supabase
      .from("experience_dates")
      .select("id", { count: "exact", head: true })
      .eq("experience_id", expId)
      .gte("start_datetime", new Date().toISOString());

    if (futureDates && futureDates > 0) {
      // Check if any future dates have confirmed bookings
      const { data: futureDateIds } = await supabase
        .from("experience_dates")
        .select("id")
        .eq("experience_id", expId)
        .gte("start_datetime", new Date().toISOString());

      if (futureDateIds && futureDateIds.length > 0) {
        const { count: activeBookings } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("experience_date_id", futureDateIds.map(d => d.id))
          .eq("status", "confirmed");

        if (activeBookings && activeBookings > 0) {
          toast.error("Non puoi archiviare un'esperienza con date future e partecipanti iscritti");
          return false;
        }
      }
    }
    return true;
  };

  const handleArchiveRequest = async (exp: Experience) => {
    const canArchive = await checkCanArchive(exp.id);
    if (canArchive) {
      setArchiveExperience(exp);
    }
  };

  const handleArchive = async () => {
    if (!archiveExperience) return;
    setArchiving(true);
    try {
      const { error } = await supabase
        .from("experiences")
        .update({ status: "archived" })
        .eq("id", archiveExperience.id);
      if (error) {
        devLog.error("Error archiving experience:", error);
        toast.error("Errore nell'archiviazione");
        return;
      }
      toast.success("Esperienza archiviata");
      setArchiveExperience(null);
      fetchExperiences();
    } catch (err) {
      devLog.error("Unexpected archive error:", err);
      toast.error("Errore imprevisto");
    } finally {
      setArchiving(false);
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
      setDeleteDescription(undefined);
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

  const handleDuplicate = async (exp: Experience) => {
    if (!profile?.id || !profile?.association_id) return;
    setDuplicating(exp.id);
    try {
      const { error } = await supabase.from("experiences").insert({
        title: `${exp.title} (copia)`,
        description: exp.description,
        image_url: exp.image_url,
        city: exp.city,
        city_id: exp.city_id,
        address: exp.address,
        category: exp.category,
        category_id: exp.category_id,
        sdgs: exp.sdgs,
        participant_info: exp.participant_info,
        max_participants: exp.max_participants,
        association_id: profile.association_id,
        association_name: exp.association_name,
        type: exp.type || "volunteering",
        visibility: exp.visibility || "public",
        status: "draft",
        created_by: profile.id,
      });
      if (error) {
        devLog.error("Error duplicating experience:", error);
        toast.error("Errore nella duplicazione");
        return;
      }
      toast.success("Esperienza duplicata come bozza");
      fetchExperiences();
    } catch (err) {
      devLog.error("Unexpected duplicate error:", err);
      toast.error("Errore imprevisto");
    } finally {
      setDuplicating(null);
    }
  };

  const handleDeleteDraft = (exp: Experience) => {
    setDeleteDescription("Questa azione è irreversibile. L'esperienza verrà eliminata definitivamente.");
    setDeleteExperience(exp);
  };

  const handleDeleteArchived = (exp: Experience) => {
    setDeleteDescription("Questa azione è irreversibile. L'esperienza verrà eliminata definitivamente.");
    setDeleteExperience(exp);
  };

  if (loading) {
    return (
      <AssociationLayout>
        <PageSkeleton variant="grid" />
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
            <h3 className="text-base font-medium text-foreground mb-1">Nessuna esperienza</h3>
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
                  iconClassName="text-yellow-500"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {grouped.draft.map((exp, i) => {
                      const cityName = exp.cities?.name || exp.city;
                      const metaItems: BravoCardMetaItem[] = [];
                      if (cityName) metaItems.push({ icon: MapPin, text: cityName });
                      return (
                      <BravoCard
                        key={exp.id}
                        imageUrl={exp.image_url}
                        imageAlt={exp.title}
                        title={exp.title}
                        metaItems={metaItems}
                        index={i}
                        onOpen={() => navigate(`/association/experiences/${exp.id}`)}
                        actions={
                          isMobile ? (
                            <MobileActions
                              items={[
                                { label: "Modifica", icon: Pencil, onClick: () => setEditExperience(exp) },
                                { label: "Programma", icon: Calendar, onClick: () => setManageDatesExperience(exp) },
                                { label: "Pubblica", icon: Send, onClick: () => setPublishExperience(exp) },
                                { label: "Duplica", icon: Copy, onClick: () => handleDuplicate(exp) },
                                { label: "Elimina", icon: Trash2, onClick: () => handleDeleteDraft(exp), destructive: true },
                              ]}
                            />
                          ) : (
                            <DraftActions
                              exp={exp}
                              duplicating={duplicating}
                              onEdit={setEditExperience}
                              onManageDates={setManageDatesExperience}
                              onPublish={setPublishExperience}
                              onDuplicate={handleDuplicate}
                              onDelete={handleDeleteDraft}
                            />
                          )
                        }
                      />
                      );
                    })}
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
                    {grouped.published.map((exp, i) => {
                      const cityName = exp.cities?.name || exp.city;
                      const metaItems: BravoCardMetaItem[] = [];
                      if (cityName) metaItems.push({ icon: MapPin, text: cityName });
                      return (
                      <BravoCard
                        key={exp.id}
                        imageUrl={exp.image_url}
                        imageAlt={exp.title}
                        title={exp.title}
                        metaItems={metaItems}
                        index={i}
                        onOpen={() => navigate(`/association/experiences/${exp.id}`)}
                        actions={
                          isMobile ? (
                            <MobileActions
                              items={[
                                { label: "Modifica", icon: Pencil, onClick: () => setEditExperience(exp) },
                                { label: "Programma", icon: Calendar, onClick: () => setManageDatesExperience(exp) },
                                { label: "Archivia", icon: Archive, onClick: () => handleArchiveRequest(exp) },
                                { label: "Duplica", icon: Copy, onClick: () => handleDuplicate(exp) },
                              ]}
                            />
                          ) : (
                            <PublishedActions
                              exp={exp}
                              duplicating={duplicating}
                              onEdit={setEditExperience}
                              onManageDates={setManageDatesExperience}
                              onArchive={handleArchiveRequest}
                              onDuplicate={handleDuplicate}
                            />
                          )
                        }
                      />
                      );
                    })}
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
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {grouped.archived.map((exp, i) => {
                        const cityName = exp.cities?.name || exp.city;
                        const metaItems: BravoCardMetaItem[] = [];
                        if (cityName) metaItems.push({ icon: MapPin, text: cityName });
                        return (
                        <BravoCard
                          key={exp.id}
                          imageUrl={exp.image_url}
                          imageAlt={exp.title}
                          title={exp.title}
                          metaItems={metaItems}
                          index={i}
                          onOpen={() => navigate(`/association/experiences/${exp.id}`)}
                          actions={
                            isMobile ? (
                              <MobileActions
                                items={[
                                  { label: "Ripubblica", icon: Send, onClick: () => setPublishExperience(exp) },
                                  { label: "Duplica", icon: Copy, onClick: () => handleDuplicate(exp) },
                                  ...(exp._hasBookings === false
                                    ? [{ label: "Elimina", icon: Trash2, onClick: () => handleDeleteArchived(exp), destructive: true as const }]
                                    : []),
                                ]}
                              />
                            ) : (
                              <ArchivedActions
                                exp={exp}
                                duplicating={duplicating}
                                onRepublish={setPublishExperience}
                                onDuplicate={handleDuplicate}
                                onDelete={handleDeleteArchived}
                              />
                            )
                          }
                        />
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </TooltipProvider>
        )}
      </div>

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
        isPublished={editExperience?.status === "published"}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={!!deleteExperience}
        onOpenChange={(open) => { if (!open) { setDeleteExperience(null); setDeleteDescription(undefined); } }}
        onConfirm={handleDelete}
        entityName="esperienza"
        entityLabel={deleteExperience?.title}
        description={deleteDescription}
        isLoading={deleting}
      />

      {/* Publish Confirm */}
      <AlertDialog open={!!publishExperience} onOpenChange={(open) => { if (!open) setPublishExperience(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {publishExperience?.status === "archived" ? "Ripubblica esperienza" : "Pubblica esperienza"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {publishExperience?.status === "archived"
                ? "L'esperienza tornerà visibile nel catalogo."
                : "Sei sicuro? L'esperienza sarà visibile ai dipendenti delle aziende associate."}
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
                publishExperience?.status === "archived" ? "Ripubblica" : "Pubblica"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirm */}
      <AlertDialog open={!!archiveExperience} onOpenChange={(open) => { if (!open) setArchiveExperience(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archivia esperienza</AlertDialogTitle>
            <AlertDialogDescription>
              L'esperienza non sarà più visibile nel catalogo. Tutti i dati storici saranno conservati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiving}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={archiving}>
              {archiving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archiviazione...
                </>
              ) : (
                "Archivia"
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

/* ── Action Bars ── */

function ActionButton({ tooltip, icon: Icon, onClick, className, disabled }: {
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 text-muted-foreground transition-colors", className)}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function DraftActions({ exp, duplicating, onEdit, onManageDates, onPublish, onDuplicate, onDelete }: {
  exp: Experience;
  duplicating: string | null;
  onEdit: (e: Experience) => void;
  onManageDates: (e: Experience) => void;
  onPublish: (e: Experience) => void;
  onDuplicate: (e: Experience) => void;
  onDelete: (e: Experience) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <ActionButton tooltip="Modifica" icon={Pencil} onClick={() => onEdit(exp)} className="hover:text-foreground" />
      <ActionButton tooltip="Programma" icon={Calendar} onClick={() => onManageDates(exp)} className="hover:text-primary" />
      <ActionButton tooltip="Pubblica" icon={Send} onClick={() => onPublish(exp)} className="hover:text-green-600" />
      <ActionButton
        tooltip="Duplica"
        icon={Copy}
        onClick={() => onDuplicate(exp)}
        className="hover:text-foreground"
        disabled={duplicating === exp.id}
      />
      <ActionButton tooltip="Elimina" icon={Trash2} onClick={() => onDelete(exp)} className="hover:text-destructive" />
    </div>
  );
}

function PublishedActions({ exp, duplicating, onEdit, onManageDates, onArchive, onDuplicate }: {
  exp: Experience;
  duplicating: string | null;
  onEdit: (e: Experience) => void;
  onManageDates: (e: Experience) => void;
  onArchive: (e: Experience) => void;
  onDuplicate: (e: Experience) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <ActionButton tooltip="Modifica" icon={Pencil} onClick={() => onEdit(exp)} className="hover:text-foreground" />
      <ActionButton tooltip="Programma" icon={Calendar} onClick={() => onManageDates(exp)} className="hover:text-primary" />
      <ActionButton tooltip="Archivia" icon={Archive} onClick={() => onArchive(exp)} className="hover:text-amber-600" />
      <ActionButton
        tooltip="Duplica"
        icon={Copy}
        onClick={() => onDuplicate(exp)}
        className="hover:text-foreground"
        disabled={duplicating === exp.id}
      />
    </div>
  );
}

function ArchivedActions({ exp, duplicating, onRepublish, onDuplicate, onDelete }: {
  exp: Experience;
  duplicating: string | null;
  onRepublish: (e: Experience) => void;
  onDuplicate: (e: Experience) => void;
  onDelete: (e: Experience) => void;
}) {
  const hasBookings = exp._hasBookings;
  const bookingsChecked = hasBookings !== undefined;

  return (
    <div className="flex items-center gap-0.5">
      <ActionButton tooltip="Ripubblica" icon={Send} onClick={() => onRepublish(exp)} className="hover:text-green-600" />
      <ActionButton
        tooltip="Duplica"
        icon={Copy}
        onClick={() => onDuplicate(exp)}
        className="hover:text-foreground"
        disabled={duplicating === exp.id}
      />
      {bookingsChecked && (
        hasBookings ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground/40 cursor-not-allowed"
                  disabled
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Non puoi eliminare questa esperienza perché contiene dati salvati</TooltipContent>
          </Tooltip>
        ) : (
          <ActionButton tooltip="Elimina" icon={Trash2} onClick={() => onDelete(exp)} className="hover:text-destructive" />
        )
      )}
    </div>
  );
}

/* ── Mobile Dropdown ── */

interface MobileActionItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  destructive?: boolean;
}

function MobileActions({ items }: { items: MobileActionItem[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs text-muted-foreground gap-1.5">
          <MoreHorizontal className="h-3.5 w-3.5" />
          Azioni
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map((item) => (
          <DropdownMenuItem
            key={item.label}
            onClick={item.onClick}
            className={item.destructive ? "text-destructive focus:text-destructive" : undefined}
          >
            <item.icon className="h-4 w-4 mr-2" />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
