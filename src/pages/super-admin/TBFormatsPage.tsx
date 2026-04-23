import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, Search, Eye, Edit, Trash2, Users, Clock, MapPin,
  Send, Archive, RotateCcw, Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";
import { TBFormatEditDialog, type TBFormat } from "@/components/super-admin/TBFormatEditDialog";
import { validateFormatPublish } from "@/lib/tb-format-validation";

interface Category {
  id: string;
  name: string;
  default_sdgs: string[] | null;
}
interface City { id: string; name: string; }
interface Association { id: string; name: string; }
type TBFormatWithCities = TBFormat & { tb_format_cities?: { city_id: string }[] };

const LOCATION_LABELS: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Entrambi",
};

export default function TBFormatsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formats, setFormats] = useState<TBFormatWithCities[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<TBFormat | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fmtRes, catRes, citRes, assRes] = await Promise.all([
        supabase.from("tb_formats").select("*, tb_format_cities(city_id)").order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, default_sdgs").order("name"),
        supabase.from("cities").select("id, name").order("name"),
        supabase.from("associations").select("id, name").order("name"),
      ]);

      if (fmtRes.error) throw fmtRes.error;
      if (catRes.error) throw catRes.error;
      if (citRes.error) throw citRes.error;
      if (assRes.error) throw assRes.error;

      setFormats(fmtRes.data as TBFormatWithCities[] || []);
      setCategories(catRes.data || []);
      setCities(citRes.data || []);
      setAssociations(assRes.data || []);
    } catch (error) {
      devLog.error("Error fetching TB formats data:", error);
      toast({ variant: "destructive", title: "Errore", description: "Impossibile caricare i dati" });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return "—";
    return categories.find((c) => c.id === catId)?.name || "—";
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

  const handleQuickStatusChange = async (fmt: TBFormat, newStatus: string) => {
    setQuickActionLoading(fmt.id);
    try {
      // For publishing, validate first
      if (newStatus === "published") {
        const [citRes, assRes] = await Promise.all([
          supabase.from("tb_format_cities").select("city_id").eq("format_id", fmt.id),
          supabase.from("tb_format_associations").select("association_id").eq("format_id", fmt.id),
        ]);
        const cityCount = (citRes.data || []).length;
        const assocCount = (assRes.data || []).length;

        const { valid, missing } = validateFormatPublish(fmt, fmt.nationwide ? 1 : cityCount, assocCount);
        if (!valid) {
          toast({
            variant: "destructive",
            title: "Impossibile pubblicare",
            description: `Campi mancanti: ${missing.join(", ")}`,
          });
          return;
        }
      }

      const { error } = await supabase
        .from("tb_formats")
        .update({ status: newStatus })
        .eq("id", fmt.id);
      if (error) throw error;

      toast({
        title: "Stato aggiornato",
        description: `Format ${newStatus === "published" ? "pubblicato" : newStatus === "archived" ? "archiviato" : "riportato in bozza"}`,
      });
      fetchData();
    } catch (error: any) {
      devLog.error("Error changing format status:", error);
      toast({ variant: "destructive", title: "Errore", description: error.message });
    } finally {
      setQuickActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedFormat) return;
    try {
      await supabase.from("tb_format_cities").delete().eq("format_id", selectedFormat.id);
      await supabase.from("tb_format_associations").delete().eq("format_id", selectedFormat.id);

      const { error } = await supabase.from("tb_formats").delete().eq("id", selectedFormat.id);
      if (error) throw error;

      toast({ title: "Eliminato", description: "Format eliminato con successo" });
      setDeleteDialogOpen(false);
      setSelectedFormat(null);
      fetchData();
    } catch (error: any) {
      devLog.error("Error deleting tb_format:", error);
      toast({ variant: "destructive", title: "Errore", description: error.message || "Impossibile eliminare" });
    }
  };

  const filteredFormats = formats.filter((f) => {
    const matchesSearch = !searchTerm || f.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || f.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getQuickAction = (fmt: TBFormat) => {
    const isLoading = quickActionLoading === fmt.id;
    if (fmt.status === "draft") {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary"
          onClick={() => handleQuickStatusChange(fmt, "published")}
          title="Pubblica"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      );
    }
    if (fmt.status === "published") {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuickStatusChange(fmt, "archived")}
          title="Archivia"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
        </Button>
      );
    }
    if (fmt.status === "archived") {
      return (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuickStatusChange(fmt, "draft")}
          title="Riattiva come bozza"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        </Button>
      );
    }
    return null;
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-xl font-bold tracking-tight">Catalogo Team Building</h1>
            <p className="text-muted-foreground text-[13px]">
              Gestisci i format del catalogo TB
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedFormat(null);
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuovo Format
          </Button>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border bg-card">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base">{formats.length} Format</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 bg-background">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="published">Pubblicati</SelectItem>
                      <SelectItem value="draft">Bozze</SelectItem>
                      <SelectItem value="archived">Archiviati</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-44 bg-background">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">Tutte le categorie</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Format</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Città</TableHead>
                      <TableHead>Partecipanti</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="w-36">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">Caricamento...</TableCell>
                      </TableRow>
                    ) : filteredFormats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nessun format trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFormats.map((fmt, index) => (
                        <motion.tr
                          key={fmt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="border-b border-border"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {fmt.image_url ? (
                                <img src={fmt.image_url} alt={fmt.title} className="w-12 h-12 rounded-lg object-cover" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{fmt.title}</p>
                                {fmt.duration_hours && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {fmt.duration_hours}h
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {getCategoryName(fmt.category_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {fmt.nationwide ? (
                              <Badge variant="secondary" className="text-xs">
                                <MapPin className="h-3 w-3 mr-1" />Tutta Italia
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {fmt.tb_format_cities?.length
                                  ? `${fmt.tb_format_cities.length} ${fmt.tb_format_cities.length === 1 ? "città" : "città"}`
                                  : "—"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {fmt.participants_min || fmt.participants_max
                              ? `${fmt.participants_min || "—"} – ${fmt.participants_max || "—"}`
                              : "—"}
                          </TableCell>
                          <TableCell>{getStatusBadge(fmt.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/super-admin/team-building/formats/${fmt.id}`)}
                                title="Dettaglio"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedFormat(fmt);
                                  setDialogOpen(true);
                                }}
                                title="Modifica"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {getQuickAction(fmt)}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedFormat(fmt);
                                  setDeleteDialogOpen(true);
                                }}
                                title="Elimina"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Edit Dialog */}
      <TBFormatEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        format={selectedFormat}
        categories={categories}
        cities={cities}
        associations={associations}
        onSaved={fetchData}
      />

      {/* Delete Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Format</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare "{selectedFormat?.title}"? Questa azione non può essere annullata.
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
