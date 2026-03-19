import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, User, Building2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { devLog } from "@/lib/logger";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import {
  CrudTableActions,
  CrudTableRow,
  TableEmptyRow,
  TableLoadingRow,
  DeleteConfirmDialog,
} from "@/components/crud";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  company_id: string | null;
  association_id: string | null;
  companies: {
    id: string;
    name: string;
  } | null;
  associations: {
    id: string;
    name: string;
  } | null;
}

interface Company {
  id: string;
  name: string;
}

interface Association {
  id: string;
  name: string;
}

interface EditFormData {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  company_id: string | null;
  association_id: string | null;
}

const roleRequiresCompany = (role: string) => ['employee', 'hr_admin'].includes(role);
const roleRequiresAssociation = (role: string) => role === 'association_admin';
const roleShowsCompany = (role: string) => ['employee', 'hr_admin', 'super_admin'].includes(role);
const roleShowsAssociation = (role: string) => ['association_admin', 'super_admin'].includes(role);

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    first_name: "",
    last_name: "",
    email: "",
    role: "employee",
    company_id: null,
    association_id: null,
  });
  const [saving, setSaving] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, companiesRes, associationsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*, companies(id, name), associations(id, name)")
          .order("created_at", { ascending: false }),
        supabase.from("companies").select("id, name").order("name"),
        supabase.from("associations").select("id, name").order("name"),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (companiesRes.error) throw companiesRes.error;
      if (associationsRes.error) throw associationsRes.error;

      setUsers(usersRes.data || []);
      setCompanies(companiesRes.data || []);
      setAssociations(associationsRes.data || []);
    } catch (error) {
      devLog.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        user.email.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesCompany =
        companyFilter === "all" || user.company_id === companyFilter;

      return matchesSearch && matchesRole && matchesCompany;
    });
  }, [users, searchTerm, roleFilter, companyFilter]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-primary text-primary-foreground">Super Admin</Badge>;
      case "hr_admin":
        return <Badge className="bg-bravo-magenta text-white">HR Admin</Badge>;
      case "association_admin":
        return <Badge className="bg-secondary text-secondary-foreground">Admin Associazione</Badge>;
      default:
        return <Badge variant="secondary">Dipendente</Badge>;
    }
  };

  const getRoleChangeWarning = () => {
    if (!editingUser) return null;
    
    const originalRole = editingUser.role;
    const newRole = editFormData.role;
    
    if (originalRole === newRole) return null;
    
    if (roleRequiresCompany(originalRole) && newRole === 'association_admin' && editingUser.companies) {
      return `L'utente verrà rimosso da "${editingUser.companies.name}"`;
    }
    
    if (originalRole === 'association_admin' && roleRequiresCompany(newRole) && editingUser.associations) {
      return `L'utente verrà rimosso da "${editingUser.associations.name}"`;
    }
    
    return null;
  };

  const handleOpenEdit = (user: Profile) => {
    setEditingUser(user);
    setEditFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      association_id: user.association_id,
    });
    setEditDialogOpen(true);
  };

  const handleRoleChange = (newRole: string) => {
    setEditFormData((prev) => {
      const updated = { ...prev, role: newRole };
      
      if (roleRequiresCompany(newRole)) {
        updated.association_id = null;
      } else if (roleRequiresAssociation(newRole)) {
        updated.company_id = null;
      }
      
      return updated;
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    if (!editFormData.email.trim()) {
      toast.error("L'email è obbligatoria");
      return;
    }
    if (!editFormData.first_name.trim()) {
      toast.error("Il nome è obbligatorio");
      return;
    }
    if (!editFormData.last_name.trim()) {
      toast.error("Il cognome è obbligatorio");
      return;
    }

    if (roleRequiresCompany(editFormData.role) && !editFormData.company_id) {
      toast.error("Seleziona un'azienda per questo ruolo");
      return;
    }
    if (roleRequiresAssociation(editFormData.role) && !editFormData.association_id) {
      toast.error("Seleziona un'associazione per questo ruolo");
      return;
    }

    setSaving(true);
    try {
      let finalCompanyId: string | null = null;
      let finalAssociationId: string | null = null;

      if (roleRequiresCompany(editFormData.role)) {
        finalCompanyId = editFormData.company_id;
      } else if (roleRequiresAssociation(editFormData.role)) {
        finalAssociationId = editFormData.association_id;
      } else if (editFormData.role === 'super_admin') {
        finalCompanyId = editFormData.company_id;
        finalAssociationId = editFormData.association_id;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: editFormData.first_name.trim(),
          last_name: editFormData.last_name.trim(),
          email: editFormData.email.trim(),
          role: editFormData.role,
          company_id: finalCompanyId,
          association_id: finalAssociationId,
        })
        .eq("id", editingUser.id);

      if (profileError) throw profileError;

      const { error: tenantError } = await supabase
        .from("user_tenants")
        .upsert({
          user_id: editingUser.id,
          company_id: finalCompanyId,
          association_id: finalAssociationId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (tenantError) {
        devLog.error("Error updating user_tenants:", tenantError);
      }

      if (editFormData.role !== editingUser.role) {
        const { error: roleError } = await supabase.rpc('admin_set_user_role', {
          p_user_id: editingUser.id,
          p_role: editFormData.role as "employee" | "hr_admin" | "association_admin" | "super_admin",
        });

        if (roleError) throw roleError;
      }

      toast.success("Utente aggiornato con successo");
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      devLog.error("Error updating user:", error);
      toast.error("Errore durante l'aggiornamento dell'utente");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDelete = (user: Profile) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", deletingUser.id);

      if (error) throw error;

      toast.success("Utente eliminato con successo");
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchData();
    } catch (error) {
      devLog.error("Error deleting user:", error);
      toast.error("Errore durante l'eliminazione dell'utente");
    } finally {
      setDeleting(false);
    }
  };

  const getEntityDisplay = (user: Profile) => {
    if (user.companies) {
      return (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {user.companies.name}
        </div>
      );
    }
    if (user.associations) {
      return (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-bravo-magenta" />
          {user.associations.name}
        </div>
      );
    }
    return <span className="text-muted-foreground">—</span>;
  };

  const roleChangeWarning = getRoleChangeWarning();

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Utenti"
          description="Gestisci tutti gli utenti registrati sulla piattaforma"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border bg-card">
            <CardHeader>
              <CardTitle className="text-base">{users.length} Utenti</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-background">
                    <SelectValue placeholder="Ruolo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Tutti i ruoli</SelectItem>
                    <SelectItem value="employee">Dipendente</SelectItem>
                    <SelectItem value="hr_admin">HR Admin</SelectItem>
                    <SelectItem value="association_admin">Admin Associazione</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-background">
                    <SelectValue placeholder="Azienda" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Tutte le aziende</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <tr className="bg-muted/50">
                      <TableHead>Utente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ruolo</TableHead>
                      <TableHead>Azienda/Associazione</TableHead>
                      <TableHead>Registrato il</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableLoadingRow colSpan={6} />
                    ) : filteredUsers.length === 0 ? (
                      <TableEmptyRow
                        colSpan={6}
                        icon={User}
                        message="Nessun utente trovato"
                        description="Non ci sono utenti che corrispondono ai filtri."
                      />
                    ) : (
                      filteredUsers.map((user, index) => (
                        <CrudTableRow key={user.id} index={index}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-bravo-purple/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-bravo-purple" />
                              </div>
                              <span className="font-medium">
                                {user.first_name || user.last_name
                                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                                  : "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getEntityDisplay(user)}</TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), "dd MMM yyyy", {
                              locale: it,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <CrudTableActions
                              onEdit={() => handleOpenEdit(user)}
                              onDelete={() => handleOpenDelete(user)}
                            />
                          </TableCell>
                        </CrudTableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Mostrando {filteredUsers.length} di {users.length} utenti
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifica Utente</DialogTitle>
            <DialogDescription>
              Modifica i dati dell'utente selezionato
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Nome</Label>
                <Input
                  id="first_name"
                  value={editFormData.first_name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  placeholder="Mario"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Cognome</Label>
                <Input
                  id="last_name"
                  value={editFormData.last_name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  placeholder="Rossi"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder="mario.rossi@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Ruolo</Label>
              <Select
                value={editFormData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger id="role" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="employee">Dipendente</SelectItem>
                  <SelectItem value="hr_admin">HR Admin</SelectItem>
                  <SelectItem value="association_admin">Admin Associazione</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {roleChangeWarning && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{roleChangeWarning}</AlertDescription>
              </Alert>
            )}

            {roleShowsCompany(editFormData.role) && (
              <div className="space-y-2">
                <Label htmlFor="company">
                  Azienda {roleRequiresCompany(editFormData.role) && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={editFormData.company_id || "none"}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      company_id: value === "none" ? null : value,
                    }))
                  }
                >
                  <SelectTrigger id="company" className="bg-background">
                    <SelectValue placeholder="Seleziona azienda" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {!roleRequiresCompany(editFormData.role) && (
                      <SelectItem value="none">Nessuna azienda</SelectItem>
                    )}
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {roleShowsAssociation(editFormData.role) && (
              <div className="space-y-2">
                <Label htmlFor="association">
                  Associazione {roleRequiresAssociation(editFormData.role) && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={editFormData.association_id || "none"}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      association_id: value === "none" ? null : value,
                    }))
                  }
                >
                  <SelectTrigger id="association" className="bg-background">
                    <SelectValue placeholder="Seleziona associazione" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {!roleRequiresAssociation(editFormData.role) && (
                      <SelectItem value="none">Nessuna associazione</SelectItem>
                    )}
                    {associations.map((association) => (
                      <SelectItem key={association.id} value={association.id}>
                        {association.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Annulla
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Salvataggio..." : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        entityName="utente"
        entityLabel={deletingUser ? `${deletingUser.first_name} ${deletingUser.last_name}` : undefined}
        isLoading={deleting}
      />
    </SuperAdminLayout>
  );
}
