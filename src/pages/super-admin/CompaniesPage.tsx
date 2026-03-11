import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Building2, Key, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  access_codes_count: number;
  _count?: {
    users: number;
  };
  // Hour budget
  hourBudget?: {
    hours_per_employee_year: number;
    fiscal_year_start: string;
  } | null;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    hours_per_employee_year: 0,
    fiscal_year_start: "01-01",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data: companiesData, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: accessCodesData, error: accessCodesError } = await supabase
        .from("access_codes")
        .select("entity_id")
        .eq("entity_type", "company");

      if (accessCodesError) throw accessCodesError;

      const accessCodesCountMap = new Map<string, number>();
      (accessCodesData || []).forEach((ac) => {
        const current = accessCodesCountMap.get(ac.entity_id) || 0;
        accessCodesCountMap.set(ac.entity_id, current + 1);
      });

      // Fetch hour budgets for all companies
      const { data: hourBudgetsData } = await supabase
        .from("hour_budgets")
        .select("company_id, hours_per_employee_year, fiscal_year_start")
        .order("created_at", { ascending: false });

      const hourBudgetMap = new Map<string, { hours_per_employee_year: number; fiscal_year_start: string }>();
      (hourBudgetsData || []).forEach((hb) => {
        if (!hourBudgetMap.has(hb.company_id)) {
          hourBudgetMap.set(hb.company_id, {
            hours_per_employee_year: Number(hb.hours_per_employee_year),
            fiscal_year_start: hb.fiscal_year_start,
          });
        }
      });

      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id);

          return {
            ...company,
            access_codes_count: accessCodesCountMap.get(company.id) || 0,
            _count: { users: count || 0 },
            hourBudget: hourBudgetMap.get(company.id) || null,
          };
        })
      );

      setCompanies(companiesWithCounts);
    } catch (error) {
      devLog.error("Error fetching companies:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile caricare le aziende",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setSelectedCompany(company);
      const fiscalDate = company.hourBudget?.fiscal_year_start;
      let fiscalMMDD = "01-01";
      if (fiscalDate) {
        const d = new Date(fiscalDate);
        fiscalMMDD = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      setFormData({
        name: company.name,
        logo_url: company.logo_url || "",
        hours_per_employee_year: company.hourBudget?.hours_per_employee_year || 0,
        fiscal_year_start: fiscalMMDD,
      });
    } else {
      setSelectedCompany(null);
      setFormData({
        name: "",
        logo_url: "",
        hours_per_employee_year: 0,
        fiscal_year_start: "01-01",
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
      if (selectedCompany) {
        const { error } = await supabase
          .from("companies")
          .update({
            name: formData.name,
            logo_url: formData.logo_url || null,
          })
          .eq("id", selectedCompany.id);

        if (error) throw error;

        // Upsert hour budget
        const [mm, dd] = formData.fiscal_year_start.split("-");
        const fiscalDate = `2025-${mm}-${dd}`;

        const { data: existingBudget } = await supabase
          .from("hour_budgets")
          .select("id")
          .eq("company_id", selectedCompany.id)
          .limit(1);

        if (existingBudget && existingBudget.length > 0) {
          await supabase
            .from("hour_budgets")
            .update({
              hours_per_employee_year: formData.hours_per_employee_year,
              fiscal_year_start: fiscalDate,
            })
            .eq("id", existingBudget[0].id);
        } else if (formData.hours_per_employee_year > 0) {
          await supabase.from("hour_budgets").insert({
            company_id: selectedCompany.id,
            hours_per_employee_year: formData.hours_per_employee_year,
            fiscal_year_start: fiscalDate,
          });
        }

        toast({
          title: "Successo",
          description: "Azienda aggiornata",
        });
      } else {
        const { data: newCompany, error } = await supabase.from("companies").insert({
          name: formData.name,
          logo_url: formData.logo_url || null,
        }).select().single();

        if (error) throw error;

        // Create hour budget if configured
        if (newCompany && formData.hours_per_employee_year > 0) {
          const [mm, dd] = formData.fiscal_year_start.split("-");
          await supabase.from("hour_budgets").insert({
            company_id: newCompany.id,
            hours_per_employee_year: formData.hours_per_employee_year,
            fiscal_year_start: `2025-${mm}-${dd}`,
          });
        }

        toast({
          title: "Successo",
          description: "Azienda creata. Vai a Codici Accesso per creare i codici di registrazione.",
        });
      }

      setDialogOpen(false);
      fetchCompanies();
    } catch (error: any) {
      devLog.error("Error saving company:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile salvare l'azienda",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .delete()
        .eq("id", selectedCompany.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Azienda eliminata",
      });

      setDeleteDialogOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error: any) {
      devLog.error("Error deleting company:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description:
          error.message || "Impossibile eliminare l'azienda. Potrebbe avere utenti associati.",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Aziende"
          description="Gestisci le aziende clienti della piattaforma"
          actions={
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuova Azienda
            </Button>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CrudTableCard
            title={`${companies.length} Aziende`}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Cerca azienda..."
          >
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <tr className="bg-muted/50">
                    <TableHead>Azienda</TableHead>
                    <TableHead>Codici Accesso</TableHead>
                    <TableHead>Utenti</TableHead>
                    <TableHead>Creata il</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableLoadingRow colSpan={5} />
                  ) : filteredCompanies.length === 0 ? (
                    <TableEmptyRow
                      colSpan={5}
                      icon={Building2}
                      message="Nessuna azienda trovata"
                      description="Non ci sono aziende che corrispondono alla ricerca."
                    />
                  ) : (
                    filteredCompanies.map((company, index) => (
                      <CrudTableRow key={company.id} index={index}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {company.logo_url ? (
                              <img
                                src={company.logo_url}
                                alt={company.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <span className="font-medium">{company.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/super-admin/access-codes?entity_type=company&entity_id=${company.id}`}
                            className="inline-flex items-center gap-1.5 text-sm hover:underline"
                          >
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {company.access_codes_count}{" "}
                              {company.access_codes_count === 1 ? "codice" : "codici"}
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </Link>
                        </TableCell>
                        <TableCell>{company._count?.users || 0}</TableCell>
                        <TableCell>
                          {format(new Date(company.created_at), "dd MMM yyyy", {
                            locale: it,
                          })}
                        </TableCell>
                        <TableCell>
                          <CrudTableActions
                            onEdit={() => handleOpenDialog(company)}
                            onDelete={() => {
                              setSelectedCompany(company);
                              setDeleteDialogOpen(true);
                            }}
                          />
                        </TableCell>
                      </CrudTableRow>
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
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? "Modifica Azienda" : "Nuova Azienda"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome azienda"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo (opzionale)</Label>
              <LogoUpload
                currentLogoUrl={formData.logo_url || null}
                onLogoChange={(url) => setFormData({ ...formData, logo_url: url || "" })}
                bucket="company-logos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours_budget">Budget ore annuale per dipendente</Label>
              <Input
                id="hours_budget"
                type="number"
                min={0}
                value={formData.hours_per_employee_year}
                onChange={(e) =>
                  setFormData({ ...formData, hours_per_employee_year: Number(e.target.value) })
                }
                placeholder="0 = illimitato"
              />
              <p className="text-xs text-muted-foreground">
                Inserisci 0 per budget illimitato
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal_start">Inizio anno fiscale (MM-GG)</Label>
              <Input
                id="fiscal_start"
                value={formData.fiscal_year_start}
                onChange={(e) =>
                  setFormData({ ...formData, fiscal_year_start: e.target.value })
                }
                placeholder="01-01"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground">
                Formato: MM-GG (es. 01-01 per 1 Gennaio)
              </p>
            </div>
            {!selectedCompany && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <p>
                  Dopo aver creato l'azienda, vai in{" "}
                  <span className="font-medium text-foreground">Codici Accesso</span> per
                  generare i codici di registrazione per dipendenti e HR admin.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvataggio..." : selectedCompany ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        entityName="azienda"
        entityLabel={selectedCompany?.name}
        description={`Sei sicuro di voler eliminare ${selectedCompany?.name}? Questa azione eliminerà anche tutti i codici di accesso associati.`}
        isLoading={saving}
      />
    </SuperAdminLayout>
  );
}
