import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";

interface Company {
  id: string;
  name: string;
}

interface VisibilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId: string;
  currentVisibility: string;
  companies: Company[];
  onSaved: () => void;
}

export function VisibilityDialog({
  open,
  onOpenChange,
  experienceId,
  currentVisibility,
  companies,
  onSaved,
}: VisibilityDialogProps) {
  const [isPrivate, setIsPrivate] = useState(currentVisibility === "private");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && experienceId) {
      setIsPrivate(currentVisibility === "private");
      fetchAssignments();
    }
  }, [open, experienceId, currentVisibility]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("experience_companies")
        .select("company_id")
        .eq("experience_id", experienceId);

      if (error) throw error;

      setSelectedCompanyIds(new Set((data || []).map((d) => d.company_id)));
    } catch (error) {
      devLog.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (isPrivate && selectedCompanyIds.size === 0) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Seleziona almeno un'azienda per un'esperienza privata",
      });
      return;
    }

    setSaving(true);
    try {
      // 1. Update visibility
      const { error: updateError } = await supabase
        .from("experiences")
        .update({ visibility: isPrivate ? "private" : "public" })
        .eq("id", experienceId);

      if (updateError) throw updateError;

      // 2. Sync experience_companies
      if (isPrivate) {
        const selectedIds = Array.from(selectedCompanyIds);

        // Delete removed
        await supabase
          .from("experience_companies")
          .delete()
          .eq("experience_id", experienceId);

        // Insert all selected
        if (selectedIds.length > 0) {
          const { error: insertError } = await supabase
            .from("experience_companies")
            .upsert(
              selectedIds.map((cid) => ({
                experience_id: experienceId,
                company_id: cid,
              }))
            );

          if (insertError) throw insertError;
        }
      }

      toast({
        title: "Successo",
        description: isPrivate
          ? "Esperienza impostata come privata"
          : "Esperienza impostata come pubblica",
      });

      onSaved();
    } catch (error: any) {
      devLog.error("Error saving visibility:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile salvare la visibilità",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Gestisci Visibilità</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Esperienza privata</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visibile solo alle aziende selezionate
              </p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          {isPrivate && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Aziende autorizzate
              </Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Caricamento...</p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        id={`company-${company.id}`}
                        checked={selectedCompanyIds.has(company.id)}
                        onCheckedChange={() => handleCompanyToggle(company.id)}
                      />
                      <label
                        htmlFor={`company-${company.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {company.name}
                      </label>
                    </div>
                  ))}
                  {companies.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nessuna azienda disponibile
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {!isPrivate && (
            <p className="text-sm text-muted-foreground">
              L'esperienza sarà visibile a tutte le aziende con il servizio
              volontariato attivo.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
