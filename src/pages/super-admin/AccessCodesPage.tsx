import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  Copy,
  Check,
  Building2,
  Heart,
  CalendarIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
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
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";
import { cn } from "@/lib/utils";

interface AccessCode {
  id: string;
  code: string;
  entity_type: string;
  entity_id: string;
  assigned_role: string;
  is_active: boolean;
  max_uses: number | null;
  expires_at: string | null;
  use_count: number;
  created_at: string;
  entity_name?: string;
}

interface Entity {
  id: string;
  name: string;
}

const ROLE_OPTIONS = [
  { value: "employee", label: "Dipendente", color: "bg-muted text-muted-foreground" },
  { value: "hr_admin", label: "HR Admin", color: "bg-primary/20 text-primary" },
  { value: "association_admin", label: "Admin Associazione", color: "bg-secondary/80 text-secondary-foreground" },
  { value: "super_admin", label: "Super Admin", color: "bg-accent text-accent-foreground" },
];

const ENTITY_TYPE_OPTIONS = [
  { value: "company", label: "Azienda", icon: Building2 },
  { value: "association", label: "Associazione", icon: Heart },
];

export default function AccessCodesPage() {
  const [searchParams] = useSearchParams();
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [companies, setCompanies] = useState<Entity[]>([]);
  const [associations, setAssociations] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>(
    searchParams.get("entity_type") || "all"
  );
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<AccessCode | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    entity_type: "company",
    entity_id: "",
    assigned_role: "employee",
    is_active: true,
    max_uses: "",
    expires_at: null as Date | null,
  });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get entity_id from URL if present
  const urlEntityId = searchParams.get("entity_id");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [codesRes, companiesRes, associationsRes] = await Promise.all([
        supabase
          .from("access_codes")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("companies")
          .select("id, name")
          .order("name", { ascending: true }),
        supabase
          .from("associations")
          .select("id, name")
          .order("name", { ascending: true }),
      ]);

      if (codesRes.error) throw codesRes.error;
      if (companiesRes.error) throw companiesRes.error;
      if (associationsRes.error) throw associationsRes.error;

      // Build entity name map
      const entityMap = new Map<string, string>();
      (companiesRes.data || []).forEach((c) => entityMap.set(c.id, c.name));
      (associationsRes.data || []).forEach((a) => entityMap.set(a.id, a.name));

      const codesWithNames = (codesRes.data || []).map((code) => ({
        ...code,
        entity_name: entityMap.get(code.entity_id) || "Sconosciuto",
      }));

      setAccessCodes(codesWithNames);
      setCompanies(companiesRes.data || []);
      setAssociations(associationsRes.data || []);
    } catch (error) {
      devLog.error("Error fetching access codes:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare i codici di accesso",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleOpenDialog = (code?: AccessCode) => {
    if (code) {
      setSelectedCode(code);
      setFormData({
        code: code.code,
        entity_type: code.entity_type,
        entity_id: code.entity_id,
        assigned_role: code.assigned_role,
        is_active: code.is_active,
        max_uses: code.max_uses?.toString() || "",
        expires_at: code.expires_at ? new Date(code.expires_at) : null,
      });
    } else {
      setSelectedCode(null);
      // Pre-fill entity_id from URL if available
      const defaultEntityType = searchParams.get("entity_type") || "company";
      const defaultEntityId = urlEntityId || "";
      setFormData({
        code: generateCode(),
        entity_type: defaultEntityType,
        entity_id: defaultEntityId,
        assigned_role: "employee",
        is_active: true,
        max_uses: "",
        expires_at: null,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim() || !formData.entity_id) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Codice ed entità sono obbligatori",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: formData.code.toUpperCase().trim(),
        entity_type: formData.entity_type,
        entity_id: formData.entity_id,
        assigned_role: formData.assigned_role,
        is_active: formData.is_active,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : null,
      };

      if (selectedCode) {
        const { error } = await supabase
          .from("access_codes")
          .update(payload)
          .eq("id", selectedCode.id);

        if (error) throw error;

        toast({
          title: "Successo",
          description: "Codice di accesso aggiornato",
        });
      } else {
        const { error } = await supabase.from("access_codes").insert(payload);

        if (error) throw error;

        toast({
          title: "Successo",
          description: "Codice di accesso creato",
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      devLog.error("Error saving access code:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message?.includes("duplicate")
          ? "Questo codice esiste già"
          : error.message || "Impossibile salvare il codice",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCode) return;

    try {
      const { error } = await supabase
        .from("access_codes")
        .delete()
        .eq("id", selectedCode.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Codice di accesso eliminato",
      });

      setDeleteDialogOpen(false);
      setSelectedCode(null);
      fetchData();
    } catch (error: any) {
      devLog.error("Error deleting access code:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile eliminare il codice",
      });
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleActive = async (code: AccessCode) => {
    try {
      const { error } = await supabase
        .from("access_codes")
        .update({ is_active: !code.is_active })
        .eq("id", code.id);

      if (error) throw error;

      setAccessCodes((prev) =>
        prev.map((c) =>
          c.id === code.id ? { ...c, is_active: !c.is_active } : c
        )
      );

      toast({
        title: "Successo",
        description: `Codice ${!code.is_active ? "attivato" : "disattivato"}`,
      });
    } catch (error: any) {
      devLog.error("Error toggling access code:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile aggiornare lo stato",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const roleOption = ROLE_OPTIONS.find((r) => r.value === role);
    return (
      <Badge className={roleOption?.color || "bg-muted"}>
        {roleOption?.label || role}
      </Badge>
    );
  };

  const getEntityIcon = (entityType: string) => {
    const Icon = entityType === "company" ? Building2 : Heart;
    return <Icon className="h-4 w-4" />;
  };

  const availableEntities =
    formData.entity_type === "company" ? companies : associations;

  const filteredCodes = accessCodes.filter((code) => {
    const matchesSearch =
      !searchTerm ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.entity_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEntityType =
      entityTypeFilter === "all" || code.entity_type === entityTypeFilter;

    // Filter by entity_id from URL if present
    const matchesEntityId = !urlEntityId || code.entity_id === urlEntityId;

    const matchesRole =
      roleFilter === "all" || code.assigned_role === roleFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && code.is_active) ||
      (statusFilter === "inactive" && !code.is_active);

    return (
      matchesSearch &&
      matchesEntityType &&
      matchesEntityId &&
      matchesRole &&
      matchesStatus
    );
  });

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
            <h1 className="text-xl font-bold tracking-tight">
              Codici di Accesso
            </h1>
            <p className="text-muted-foreground text-[13px]">
              Gestisci i codici per la registrazione utenti
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuovo Codice
          </Button>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border bg-card">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <CardTitle className="text-base">
                  {filteredCodes.length} Codici
                </CardTitle>
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca codice o entità..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={entityTypeFilter}
                    onValueChange={setEntityTypeFilter}
                  >
                    <SelectTrigger className="w-40 bg-background">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">Tutti i tipi</SelectItem>
                      <SelectItem value="company">Aziende</SelectItem>
                      <SelectItem value="association">Associazioni</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-44 bg-background">
                      <SelectValue placeholder="Ruolo" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">Tutti i ruoli</SelectItem>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32 bg-background">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="active">Attivi</SelectItem>
                      <SelectItem value="inactive">Inattivi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Codice</TableHead>
                      <TableHead>Entità</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Utilizzi</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead>Attivo</TableHead>
                      <TableHead className="w-24">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Caricamento...
                        </TableCell>
                      </TableRow>
                    ) : filteredCodes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Nessun codice trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCodes.map((code, index) => (
                        <motion.tr
                          key={code.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="border-b border-border last:border-0"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 rounded bg-muted text-sm font-mono">
                                {code.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => copyCode(code.code, code.id)}
                              >
                                {copiedId === code.id ? (
                                  <Check className="h-4 w-4 text-secondary" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "p-1.5 rounded",
                                  code.entity_type === "company"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-secondary/50 text-secondary-foreground"
                                )}
                              >
                                {getEntityIcon(code.entity_type)}
                              </div>
                              <span className="font-medium">
                                {code.entity_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(code.assigned_role)}
                          </TableCell>
                          <TableCell>
                            {code.max_uses ? (
                              <div className="space-y-1">
                                <span className="text-sm">
                                  {code.use_count} / {code.max_uses}
                                </span>
                                <Progress
                                  value={
                                    (code.use_count / code.max_uses) * 100
                                  }
                                  className="h-1.5 w-20"
                                />
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {code.use_count} (illimitato)
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {code.expires_at ? (
                              <span
                                className={cn(
                                  "text-sm",
                                  new Date(code.expires_at) < new Date() &&
                                    "text-destructive"
                                )}
                              >
                                {format(
                                  new Date(code.expires_at),
                                  "dd MMM yyyy",
                                  {
                                    locale: it,
                                  }
                                )}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={code.is_active}
                              onCheckedChange={() => toggleActive(code)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenDialog(code)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedCode(code);
                                  setDeleteDialogOpen(true);
                                }}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle>
              {selectedCode ? "Modifica Codice" : "Nuovo Codice di Accesso"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Entity Type */}
            <div className="space-y-2">
              <Label>Tipo Entità *</Label>
              <Select
                value={formData.entity_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, entity_type: value, entity_id: "" })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {ENTITY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Entity */}
            <div className="space-y-2">
              <Label>
                {formData.entity_type === "company"
                  ? "Azienda"
                  : "Associazione"}{" "}
                *
              </Label>
              <Select
                value={formData.entity_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, entity_id: value })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {availableEntities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Ruolo da Assegnare *</Label>
              <Select
                value={formData.assigned_role}
                onValueChange={(value) =>
                  setFormData({ ...formData, assigned_role: value })
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Codice *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="CODICE123"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFormData({ ...formData, code: generateCode() })
                  }
                >
                  Genera
                </Button>
              </div>
            </div>

            {/* Max Uses */}
            <div className="space-y-2">
              <Label htmlFor="max_uses">Limite Utilizzi</Label>
              <Input
                id="max_uses"
                type="number"
                min="1"
                value={formData.max_uses}
                onChange={(e) =>
                  setFormData({ ...formData, max_uses: e.target.value })
                }
                placeholder="Illimitato"
              />
              <p className="text-xs text-muted-foreground">
                Lascia vuoto per utilizzi illimitati
              </p>
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label>Data Scadenza</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.expires_at && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expires_at
                      ? format(formData.expires_at, "dd MMMM yyyy", {
                          locale: it,
                        })
                      : "Nessuna scadenza"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expires_at || undefined}
                    onSelect={(date) =>
                      setFormData({ ...formData, expires_at: date || null })
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  {formData.expires_at && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setFormData({ ...formData, expires_at: null })
                        }
                      >
                        Rimuovi scadenza
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Codice Attivo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>

            {/* Usage count (edit only) */}
            {selectedCode && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Questo codice è stato utilizzato{" "}
                  <span className="font-medium text-foreground">
                    {selectedCode.use_count}
                  </span>{" "}
                  {selectedCode.use_count === 1 ? "volta" : "volte"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio..." : selectedCode ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Codice di Accesso</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il codice{" "}
              <code className="px-1 py-0.5 bg-muted rounded font-mono">
                {selectedCode?.code}
              </code>
              ? Questa azione non può essere annullata.
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
