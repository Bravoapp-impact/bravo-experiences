import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";
import { LogoUpload } from "@/components/super-admin/LogoUpload";
import { PageHeader } from "@/components/common/PageHeader";
import {
  CrudTableCard,
  CrudTableActions,
  CrudTableRow,
  TableEmptyRow,
  TableLoadingRow,
  DeleteConfirmDialog,
} from "@/components/crud";

interface City {
  id: string;
  name: string;
}

interface Association {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  status: string;
  internal_notes: string | null;
  partnership_start_date: string | null;
  created_at: string;
  nationwide?: boolean;
  cities?: City[];
}

const STATUS_OPTIONS = [
  { value: "active", label: "Attiva", color: "bg-secondary text-secondary-foreground" },
  { value: "suspended", label: "Sospesa", color: "bg-orange-500/20 text-orange-600" },
  { value: "archived", label: "Archiviata", color: "bg-muted text-muted-foreground" },
];

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);
  const [expandedAssociation, setExpandedAssociation] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    address: "",
    status: "active",
    internal_notes: "",
    partnership_start_date: "",
    nationwide: false,
    city_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [associationsRes, citiesRes] = await Promise.all([
        supabase
          .from("associations")
          .select("*")
          .order("name", { ascending: true }),
        supabase.from("cities").select("id, name").order("name", { ascending: true }),
      ]);

      if (associationsRes.error) throw associationsRes.error;
      if (citiesRes.error) throw citiesRes.error;

      const { data: associationCities } = await supabase
        .from("association_cities")
        .select("association_id, city_id");

      const associationsWithCities = (associationsRes.data || []).map((assoc) => {
        const cityIds = associationCities
          ?.filter((ac) => ac.association_id === assoc.id)
          .map((ac) => ac.city_id) || [];
        const assocCities = citiesRes.data?.filter((c) => cityIds.includes(c.id)) || [];
        return { ...assoc, cities: assocCities };
      });

      setAssociations(associationsWithCities);
      setCities(citiesRes.data || []);
    } catch (error) {
      devLog.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare i dati",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (association?: Association) => {
    if (association) {
      const { data: assocCities } = await supabase
        .from("association_cities")
        .select("city_id")
        .eq("association_id", association.id);

      setSelectedAssociation(association);
      setFormData({
        name: association.name,
        description: association.description || "",
        logo_url: association.logo_url || "",
        contact_name: association.contact_name || "",
        contact_email: association.contact_email || "",
        contact_phone: association.contact_phone || "",
        website: association.website || "",
        address: association.address || "",
        status: association.status,
        internal_notes: association.internal_notes || "",
        partnership_start_date: association.partnership_start_date || "",
        nationwide: association.nationwide || false,
        city_ids: assocCities?.map((c) => c.city_id) || [],
      });
    } else {
      setSelectedAssociation(null);
      setFormData({
        name: "",
        description: "",
        logo_url: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        website: "",
        address: "",
        status: "active",
        internal_notes: "",
        partnership_start_date: "",
        nationwide: false,
        city_ids: [],
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Il nome è obbligatorio",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        logo_url: formData.logo_url.trim() || null,
        contact_name: formData.contact_name.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        website: formData.website.trim() || null,
        address: formData.address.trim() || null,
        status: formData.status,
        internal_notes: formData.internal_notes.trim() || null,
        partnership_start_date: formData.partnership_start_date || null,
        nationwide: formData.nationwide,
      };

      let associationId: string;

      if (selectedAssociation) {
        const { error } = await supabase
          .from("associations")
          .update(payload)
          .eq("id", selectedAssociation.id);

        if (error) throw error;
        associationId = selectedAssociation.id;

        await supabase
          .from("association_cities")
          .delete()
          .eq("association_id", selectedAssociation.id);
      } else {
        const { data, error } = await supabase
          .from("associations")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        associationId = data.id;
      }

      if (!formData.nationwide && formData.city_ids.length > 0) {
        const cityAssociations = formData.city_ids.map((cityId) => ({
          association_id: associationId,
          city_id: cityId,
        }));

        const { error: cityError } = await supabase
          .from("association_cities")
          .insert(cityAssociations);

        if (cityError) throw cityError;
      }

      toast({
        title: "Successo",
        description: selectedAssociation
          ? "Associazione aggiornata"
          : "Associazione creata",
      });

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      devLog.error("Error saving association:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message?.includes("duplicate")
          ? "Questa associazione esiste già"
          : error.message || "Impossibile salvare l'associazione",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssociation) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("associations")
        .delete()
        .eq("id", selectedAssociation.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Associazione eliminata",
      });

      setDeleteDialogOpen(false);
      setSelectedAssociation(null);
      fetchData();
    } catch (error: any) {
      devLog.error("Error deleting association:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message?.includes("violates foreign key")
          ? "Impossibile eliminare: ci sono esperienze collegate a questa associazione"
          : error.message || "Impossibile eliminare l'associazione",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCityToggle = (cityId: string) => {
    setFormData((prev) => ({
      ...prev,
      city_ids: prev.city_ids.includes(cityId)
        ? prev.city_ids.filter((c) => c !== cityId)
        : [...prev.city_ids, cityId],
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <Badge className={statusOption?.color || "bg-muted"}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  const filteredAssociations = associations.filter((assoc) => {
    const matchesSearch =
      !searchTerm ||
      assoc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assoc.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || assoc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusFilterSelect = (
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-full sm:w-40 bg-background">
        <SelectValue placeholder="Stato" />
      </SelectTrigger>
      <SelectContent className="bg-popover">
        <SelectItem value="all">Tutti</SelectItem>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Associazioni"
          description="Gestisci i partner del volontariato"
          actions={
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuova Associazione
            </Button>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CrudTableCard
            title={`${associations.length} Associazioni`}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Cerca associazione..."
            filters={statusFilterSelect}
          >
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Associazione</TableHead>
                    <TableHead>Contatto</TableHead>
                    <TableHead>Città</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableLoadingRow colSpan={6} />
                  ) : filteredAssociations.length === 0 ? (
                    <TableEmptyRow
                      colSpan={6}
                      icon={Building}
                      message="Nessuna associazione trovata"
                      description="Non ci sono associazioni che corrispondono ai filtri."
                    />
                  ) : (
                    filteredAssociations.map((association, index) => (
                      <>
                        <CrudTableRow key={association.id} index={index}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setExpandedAssociation(
                                  expandedAssociation === association.id
                                    ? null
                                    : association.id
                                )
                              }
                            >
                              {expandedAssociation === association.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {association.logo_url ? (
                                <img
                                  src={association.logo_url}
                                  alt={association.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Building className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <span className="font-medium">{association.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {association.contact_name || association.contact_email ? (
                              <div className="text-sm">
                                {association.contact_name && (
                                  <p className="font-medium">{association.contact_name}</p>
                                )}
                                {association.contact_email && (
                                  <p className="text-muted-foreground text-xs">
                                    {association.contact_email}
                                  </p>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {association.nationwide ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">In tutta Italia</span>
                              </div>
                            ) : association.cities && association.cities.length > 0 ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {association.cities.map((c) => c.name).join(", ")}
                                </span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(association.status)}</TableCell>
                          <TableCell>
                            <CrudTableActions
                              onEdit={() => handleOpenDialog(association)}
                              onDelete={() => {
                                setSelectedAssociation(association);
                                setDeleteDialogOpen(true);
                              }}
                            />
                          </TableCell>
                        </CrudTableRow>
                        {/* Expanded details */}
                        {expandedAssociation === association.id && (
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={6} className="p-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3">
                                  <h4 className="font-medium text-sm">Dettagli Contatto</h4>
                                  <div className="space-y-2 text-sm">
                                    {association.contact_phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        {association.contact_phone}
                                      </div>
                                    )}
                                    {association.contact_email && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {association.contact_email}
                                      </div>
                                    )}
                                    {association.website && (
                                      <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <a
                                          href={association.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline"
                                        >
                                          {association.website}
                                        </a>
                                      </div>
                                    )}
                                    {association.address && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        {association.address}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-medium text-sm">Info Interne</h4>
                                  <div className="space-y-2 text-sm">
                                    {association.partnership_start_date && (
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        Partnership dal{" "}
                                        {format(
                                          new Date(association.partnership_start_date),
                                          "d MMMM yyyy",
                                          { locale: it }
                                        )}
                                      </div>
                                    )}
                                    {association.internal_notes && (
                                      <div className="p-3 rounded-lg bg-background border border-border">
                                        <p className="text-muted-foreground text-xs">
                                          Note interne:
                                        </p>
                                        <p className="mt-1">{association.internal_notes}</p>
                                      </div>
                                    )}
                                    {association.description && (
                                      <p className="text-muted-foreground">
                                        {association.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CrudTableCard>
        </motion.div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle>
              {selectedAssociation ? "Modifica Associazione" : "Nuova Associazione"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome associazione"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrizione dell'associazione..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <LogoUpload
                currentLogoUrl={formData.logo_url || null}
                onLogoChange={(url) =>
                  setFormData({ ...formData, logo_url: url || "" })
                }
                entityId={selectedAssociation?.id}
                bucket="association-logos"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nome Contatto</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                  placeholder="Mario Rossi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email Contatto</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  placeholder="email@esempio.it"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefono</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  placeholder="+39 02 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Sito Web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://www.esempio.it"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Via Roma 1, Milano"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnership_start_date">Data Inizio Partnership</Label>
                <Input
                  id="partnership_start_date"
                  type="date"
                  value={formData.partnership_start_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      partnership_start_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Città dove opera</Label>

              <div className="flex items-start space-x-2 p-3 border border-border rounded-lg bg-muted/30">
                <Checkbox
                  id="nationwide"
                  checked={formData.nationwide}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, nationwide: checked === true })
                  }
                  className="mt-0.5"
                />
                <div className="space-y-0.5">
                  <label htmlFor="nationwide" className="text-sm font-medium cursor-pointer">
                    In tutta Italia
                  </label>
                  <p className="text-xs text-muted-foreground">
                    L'associazione opera su tutto il territorio nazionale.
                  </p>
                </div>
              </div>

              <div
                className={`grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border border-border rounded-lg max-h-32 overflow-y-auto ${
                  formData.nationwide ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {cities.map((city) => (
                  <div key={city.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`city-${city.id}`}
                      checked={formData.city_ids.includes(city.id)}
                      onCheckedChange={() => handleCityToggle(city.id)}
                    />
                    <label
                      htmlFor={`city-${city.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {city.name}
                    </label>
                  </div>
                ))}
                {cities.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-3">
                    Nessuna città disponibile. Creane una prima.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="internal_notes">Note Interne (solo Super Admin)</Label>
              <Textarea
                id="internal_notes"
                value={formData.internal_notes}
                onChange={(e) =>
                  setFormData({ ...formData, internal_notes: e.target.value })
                }
                placeholder="Note interne visibili solo agli admin..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        entityName="associazione"
        entityLabel={selectedAssociation?.name}
        isLoading={saving}
      />
    </SuperAdminLayout>
  );
}
