import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Edit, Trash2, Clock, Users, MapPin, Euro, Calendar,
  CheckCircle, PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";
import { TBFormatEditDialog, type TBFormat } from "@/components/super-admin/TBFormatEditDialog";
import { TagsSection } from "@/components/experience-detail/TagsSection";
import { SdgSection } from "@/components/experience-detail/SdgSection";
import { validateFormatPublish } from "@/lib/tb-format-validation";
import { format as fmtDate } from "date-fns";
import { it } from "date-fns/locale";

interface Category { id: string; name: string; default_sdgs: string[] | null; }
interface City { id: string; name: string; }
interface Association { id: string; name: string; logo_url: string | null; }

const LOCATION_LABELS: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Indoor / Outdoor",
};

function parseJsonItems(jsonData: any): string[] {
  if (!jsonData) return [];
  if (typeof jsonData === "object" && Array.isArray(jsonData.items)) {
    return jsonData.items.filter((i: any) => typeof i === "string" && i.trim());
  }
  return [];
}

export default function TBFormatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formatData, setFormatData] = useState<TBFormat | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Lookup data
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [allAssociations, setAllAssociations] = useState<Association[]>([]);

  // Junction data
  const [linkedCityIds, setLinkedCityIds] = useState<string[]>([]);
  const [linkedAssociationIds, setLinkedAssociationIds] = useState<string[]>([]);
  const [linkedCities, setLinkedCities] = useState<City[]>([]);
  const [linkedAssociations, setLinkedAssociations] = useState<Association[]>([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAll();
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
      setAllAssociations(assRes.data as Association[] || []);

      const cityIds = (fmtCitRes.data || []).map((r) => r.city_id);
      const assocIds = (fmtAssRes.data || []).map((r) => r.association_id);
      setLinkedCityIds(cityIds);
      setLinkedAssociationIds(assocIds);

      setLinkedCities((citRes.data || []).filter((c) => cityIds.includes(c.id)));
      setLinkedAssociations(
        (assRes.data as Association[] || []).filter((a) => assocIds.includes(a.id))
      );
    } catch (error) {
      devLog.error("Error fetching TB format detail:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = () => {
    if (!formatData?.category_id) return null;
    return categories.find((c) => c.id === formatData.category_id)?.name || null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-secondary text-secondary-foreground">Pubblicato</Badge>;
      case "draft":
        return <Badge variant="outline">Bozza</Badge>;
      case "archived":
        return <Badge variant="secondary">Archiviato</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!formatData) return;

    // Validate before publishing
    if (newStatus === "published") {
      const { valid, missing } = validateFormatPublish(
        formatData,
        linkedCityIds.length,
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
      toast({ title: "Stato aggiornato", description: `Format ${newStatus === "published" ? "pubblicato" : newStatus === "archived" ? "archiviato" : "riportato in bozza"}` });
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
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-6 w-32" />
          <div className="lg:flex lg:gap-10">
            <Skeleton className="lg:w-[55%] aspect-[16/10] rounded-xl" />
            <div className="flex-1 space-y-4 mt-4 lg:mt-0">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
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

  const categoryName = getCategoryName();
  const servicesList = parseJsonItems(formatData.services);
  const extraServicesList = parseJsonItems(formatData.extra_services);

  return (
    <SuperAdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate("/super-admin/team-building/formats")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al catalogo TB
        </button>

        {/* Hero split-screen */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:flex lg:gap-10 lg:items-stretch"
        >
          {/* Image */}
          <div className="lg:w-[55%] flex-shrink-0">
            {formatData.image_url ? (
              <img
                src={formatData.image_url}
                alt={formatData.title}
                className="w-full aspect-[16/10] object-cover rounded-xl"
              />
            ) : (
              <div className="w-full aspect-[16/10] rounded-xl bg-muted/30 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Header info */}
          <div className="mt-4 lg:mt-0 lg:w-[45%] lg:flex lg:flex-col lg:justify-center space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(formatData.status)}
              {categoryName && <Badge variant="outline">{categoryName}</Badge>}
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                {LOCATION_LABELS[formatData.location_type] || formatData.location_type}
              </Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">{formatData.title}</h1>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {(formatData.participants_min || formatData.participants_max) && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {formatData.participants_min || "—"} – {formatData.participants_max || "—"} persone
                </span>
              )}
              {formatData.duration_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatData.duration_hours}h
                </span>
              )}
              {(formatData.price_range_min || formatData.price_range_max) && (
                <span className="flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  €{formatData.price_range_min || "—"} – €{formatData.price_range_max || "—"} / persona
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Creato il {fmtDate(new Date(formatData.created_at), "d MMMM yyyy", { locale: it })}
            </p>
          </div>
        </motion.div>

        {/* Two-column: content + sidebar */}
        <div className="lg:flex lg:gap-12 mt-10">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Description */}
            {formatData.description && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-lg font-semibold mb-3">Cosa farete</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {formatData.description}
                </p>
              </motion.div>
            )}

            {/* Tags */}
            {formatData.secondary_tags && formatData.secondary_tags.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Separator className="my-8" />
                <TagsSection tags={formatData.secondary_tags} />
              </motion.div>
            )}

            {/* SDGs */}
            {formatData.sdgs && formatData.sdgs.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Separator className="my-8" />
                <SdgSection sdgs={formatData.sdgs} />
              </motion.div>
            )}

            {/* Services included */}
            {servicesList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <Separator className="my-8" />
                <h2 className="text-lg font-semibold mb-3">Servizi inclusi</h2>
                <ul className="space-y-2">
                  {servicesList.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Extra services */}
            {extraServicesList.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                <Separator className="my-8" />
                <h2 className="text-lg font-semibold mb-3">Servizi extra</h2>
                <ul className="space-y-2">
                  {extraServicesList.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PlusCircle className="h-4 w-4 text-muted-foreground/70 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Cities */}
            {linkedCities.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Separator className="my-8" />
                <h2 className="text-lg font-semibold mb-3">Città disponibili</h2>
                <div className="flex flex-wrap gap-2">
                  {linkedCities.map((city) => (
                    <Badge key={city.id} variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {city.name}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Associations */}
            {linkedAssociations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Separator className="my-8" />
                <h2 className="text-lg font-semibold mb-3">Associazioni erogabili</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {linkedAssociations.map((assoc) => (
                    <div key={assoc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                      {assoc.logo_url ? (
                        <img src={assoc.logo_url} alt={assoc.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {assoc.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium">{assoc.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="h-12" />
          </div>

          {/* Sidebar */}
          <motion.div
            className="hidden lg:block w-[300px] flex-shrink-0 sticky top-24 self-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-5 space-y-3">
                <Button className="w-full gap-2" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4" />
                  Modifica
                </Button>

                {formatData.status === "draft" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange("published")}
                  >
                    Pubblica
                  </Button>
                )}
                {formatData.status === "published" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange("archived")}
                  >
                    Archivia
                  </Button>
                )}
                {formatData.status === "archived" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusChange("draft")}
                  >
                    Riporta in bozza
                  </Button>
                )}

                <Separator />

                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </Button>

                <Separator />

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Creato: {fmtDate(new Date(formatData.created_at), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                  <p>Aggiornato: {fmtDate(new Date(formatData.updated_at), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SuperAdminLayout>
  );
}
