import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";
import { TBFormatEditDialog, type TBFormat } from "@/components/super-admin/TBFormatEditDialog";
import { TBFormatDetailContent } from "@/components/tb-format-detail/TBFormatDetailContent";
import { validateFormatPublish } from "@/lib/tb-format-validation";
import { format as fmtDate } from "date-fns";
import { it } from "date-fns/locale";

interface Category {
  id: string;
  name: string;
  default_sdgs: string[] | null;
}
interface City {
  id: string;
  name: string;
}
interface Association {
  id: string;
  name: string;
  logo_url: string | null;
}

function parseJsonItems(jsonData: any): string[] {
  if (!jsonData) return [];
  if (typeof jsonData === "object" && Array.isArray(jsonData.items)) {
    return jsonData.items.filter((i: any) => typeof i === "string" && i.trim());
  }
  return [];
}

const STATUS_BADGE: Record<string, { label: string; className?: string; variant?: "outline" | "secondary" }> = {
  published: { label: "Pubblicato", className: "bg-secondary text-secondary-foreground" },
  draft: { label: "Bozza", variant: "outline" },
  archived: { label: "Archiviato", variant: "secondary" },
};

export default function TBFormatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formatData, setFormatData] = useState<TBFormat | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [allAssociations, setAllAssociations] = useState<Association[]>([]);

  const [linkedCityIds, setLinkedCityIds] = useState<string[]>([]);
  const [linkedAssociationIds, setLinkedAssociationIds] = useState<string[]>([]);
  const [linkedCities, setLinkedCities] = useState<City[]>([]);
  const [linkedAssociations, setLinkedAssociations] = useState<Association[]>([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fmtRes, catRes, citRes, assRes, fmtCitRes, fmtAssRes] = await Promise.all([
        supabase.from("tb_formats").select("*").eq("id", id!).single(),
        supabase.from("categories").select("id, name, default_sdgs").order("name"),
        supabase.from("cities").select("id, name").order("name"),
        supabase.from("associations").select("id, name, logo_url").order("name"),
        supabase.from("tb_format_cities").select("city_id").eq("format_id", id!),
        supabase.from("tb_format_associations").select("association_id").eq("format_id", id!),
      ]);

      if (fmtRes.error || !fmtRes.data) {
        setNotFound(true);
        return;
      }

      const fmt = fmtRes.data as TBFormat;
      setFormatData(fmt);
      setCategories(catRes.data || []);
      setAllCities(citRes.data || []);
      setAllAssociations((assRes.data as Association[]) || []);

      const cityIds = (fmtCitRes.data || []).map((r) => r.city_id);
      const assocIds = (fmtAssRes.data || []).map((r) => r.association_id);
      setLinkedCityIds(cityIds);
      setLinkedAssociationIds(assocIds);

      setLinkedCities((citRes.data || []).filter((c) => cityIds.includes(c.id)));
      setLinkedAssociations(
        ((assRes.data as Association[]) || []).filter((a) => assocIds.includes(a.id))
      );
    } catch (error) {
      devLog.error("Error fetching TB format detail:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!formatData) return;

    if (newStatus === "published") {
      const { valid, missing } = validateFormatPublish(
        formatData,
        formatData.nationwide ? 1 : linkedCityIds.length,
        linkedAssociationIds.length,
      );
      if (!valid) {
        toast({
          variant: "destructive",
          title: "Impossibile pubblicare",
          description: `Campi mancanti: ${missing.join(", ")}`,
        });
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("tb_formats")
        .update({ status: newStatus })
        .eq("id", formatData.id);
      if (error) throw error;
      toast({
        title: "Stato aggiornato",
        description: `Format ${
          newStatus === "published"
            ? "pubblicato"
            : newStatus === "archived"
            ? "archiviato"
            : "riportato in bozza"
        }`,
      });
      fetchAll();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    }
  };

  const handleDelete = async () => {
    if (!formatData) return;
    try {
      await supabase.from("tb_format_cities").delete().eq("format_id", formatData.id);
      await supabase.from("tb_format_associations").delete().eq("format_id", formatData.id);
      const { error } = await supabase.from("tb_formats").delete().eq("id", formatData.id);
      if (error) throw error;
      toast({ title: "Eliminato", description: "Format eliminato" });
      navigate("/super-admin/team-building/formats");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6 py-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="w-full aspect-[4/3] lg:aspect-square rounded-xl max-w-2xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </SuperAdminLayout>
    );
  }

  if (notFound || !formatData) {
    return (
      <SuperAdminLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-lg font-semibold mb-2">Format non trovato</h2>
          <Button variant="outline" onClick={() => navigate("/super-admin/team-building/formats")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al catalogo
          </Button>
        </div>
      </SuperAdminLayout>
    );
  }

  const categoryName =
    categories.find((c) => c.id === formatData.category_id)?.name ?? null;
  const servicesList = parseJsonItems(formatData.services);
  const extraServicesList = parseJsonItems(formatData.extra_services);

  const statusBadgeMeta = STATUS_BADGE[formatData.status] ?? {
    label: formatData.status,
    variant: "secondary" as const,
  };

  const headerExtras = (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge
        className={statusBadgeMeta.className}
        variant={statusBadgeMeta.variant}
      >
        {statusBadgeMeta.label}
      </Badge>
    </div>
  );

  // Status change CTA — different label per current status
  const nextStatusAction = (() => {
    if (formatData.status === "draft") {
      return { label: "Pubblica", target: "published" };
    }
    if (formatData.status === "published") {
      return { label: "Archivia", target: "archived" };
    }
    return { label: "Riporta in bozza", target: "draft" };
  })();

  const priceLine =
    formatData.price_range_min || formatData.price_range_max
      ? `€${formatData.price_range_min ?? "—"} – €${formatData.price_range_max ?? "—"} / persona`
      : null;

  return (
    <SuperAdminLayout>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-32 lg:pb-12">
        <button
          onClick={() => navigate("/super-admin/team-building/formats")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al catalogo TB
        </button>

        <TBFormatDetailContent
          format={{
            id: formatData.id,
            title: formatData.title,
            description: formatData.description,
            short_description: formatData.short_description,
            image_url: formatData.image_url,
            category_name: categoryName,
            location_type: formatData.location_type,
            duration_hours: formatData.duration_hours,
            participants_min: formatData.participants_min,
            participants_max: formatData.participants_max,
            sdgs: formatData.sdgs,
            secondary_tags: formatData.secondary_tags,
          }}
          services={servicesList}
          extraServices={extraServicesList}
          cities={linkedCities}
          nationwide={formatData.nationwide}
          associations={linkedAssociations}
          headerExtras={headerExtras}
          sidebarSlot={
            <motion.div
              className="hidden lg:block w-[380px] flex-shrink-0 sticky top-24 self-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50">
                <CardContent className="p-5 space-y-4">
                  {/* Operational metadata */}
                  <div className="space-y-2 text-sm">
                    {priceLine && (
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-muted-foreground">Prezzo</span>
                        <span className="font-medium text-foreground">{priceLine}</span>
                      </div>
                    )}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <Badge
                        className={statusBadgeMeta.className}
                        variant={statusBadgeMeta.variant}
                      >
                        {statusBadgeMeta.label}
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted-foreground">Creato</span>
                      <span className="text-xs text-foreground">
                        {fmtDate(new Date(formatData.created_at), "d MMM yyyy", { locale: it })}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <Button className="w-full gap-2" onClick={() => setEditDialogOpen(true)}>
                    <Edit className="h-4 w-4" />
                    Modifica
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange(nextStatusAction.target)}
                  >
                    {nextStatusAction.label}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Elimina
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          }
          mobileDrawerSlot={
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] z-40 flex gap-2">
              <Button
                className="flex-1 gap-2 h-12"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
                Modifica
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-[200]">
                  <DropdownMenuItem onClick={() => handleStatusChange(nextStatusAction.target)}>
                    {nextStatusAction.label}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />
      </div>

      {/* Edit Dialog */}
      <TBFormatEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        format={formatData}
        categories={categories}
        cities={allCities}
        associations={allAssociations}
        onSaved={fetchAll}
        initialCityIds={linkedCityIds}
        initialAssociationIds={linkedAssociationIds}
      />

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Format</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare "{formatData.title}"? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperAdminLayout>
  );
}
