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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

type Mode = "shared" | "exclusive";

export function VisibilityDialog({
  open,
  onOpenChange,
  experienceId,
  currentVisibility,
  companies,
  onSaved,
}: VisibilityDialogProps) {
  const [mode, setMode] = useState<Mode>(
    currentVisibility === "private" ? "exclusive" : "shared"
  );
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [exclusiveCompanyId, setExclusiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && experienceId) {
      setMode(currentVisibility === "private" ? "exclusive" : "shared");
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

      const ids = (data || []).map((d) => d.company_id);
      setSelectedCompanyIds(new Set(ids));
      setExclusiveCompanyId(ids[0] ?? null);
    } catch (error) {
      devLog.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    if (next === "exclusive") {
      // Pre-seleziona la prima azienda dal set, se presente
      if (!exclusiveCompanyId) {
        const first = Array.from(selectedCompanyIds)[0];
        if (first) setExclusiveCompanyId(first);
      }
    } else {
      // Passando a condivisa, includi l'azienda esclusiva nel set
      if (exclusiveCompanyId) {
        setSelectedCompanyIds((prev) => {
          const next = new Set(prev);
          next.add(exclusiveCompanyId);
          return next;
        });
      }
    }
    setMode(next);
  };

  const handleCompanyToggle = (companyId: string) => {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  };

  const canSave = mode === "shared" || !!exclusiveCompanyId;

  const handleSave = async () => {
    if (mode === "exclusive" && !exclusiveCompanyId) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Seleziona un'azienda per un'esperienza esclusiva",
      });
      return;
    }

    setSaving(true);
    try {
      // 1. Azzera il bridge per evitare stati intermedi che violerebbero il trigger
      const { error: deleteError } = await supabase
        .from("experience_companies")
        .delete()
        .eq("experience_id", experienceId);
      if (deleteError) throw deleteError;

      // 2. Aggiorna visibility
      const newVisibility = mode === "exclusive" ? "private" : "public";
      const { error: updateError } = await supabase
        .from("experiences")
        .update({ visibility: newVisibility })
        .eq("id", experienceId);
      if (updateError) throw updateError;

      // 3. Inserisci le righe nuove
      const rowsToInsert =
        mode === "exclusive"
          ? [{ experience_id: experienceId, company_id: exclusiveCompanyId! }]
          : Array.from(selectedCompanyIds).map((cid) => ({
              experience_id: experienceId,
              company_id: cid,
            }));

      if (rowsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("experience_companies")
          .insert(rowsToInsert);
        if (insertError) throw insertError;
      }

      toast({
        title: "Successo",
        description:
          mode === "exclusive"
            ? "Esperienza esclusiva aggiornata"
            : "Esperienza condivisa aggiornata",
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
          <DialogTitle>Visibilità e assegnazione</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Mode selector */}
          <RadioGroup
            value={mode}
            onValueChange={(v) => handleModeChange(v as Mode)}
            className="gap-3"
          >
            <label
              htmlFor="mode-shared"
              className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40"
            >
              <RadioGroupItem value="shared" id="mode-shared" className="mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Condivisa</div>
                <p className="text-xs text-muted-foreground">
                  Visibile a tutte le aziende selezionate
                </p>
              </div>
            </label>
            <label
              htmlFor="mode-exclusive"
              className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40"
            >
              <RadioGroupItem value="exclusive" id="mode-exclusive" className="mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Esclusiva</div>
                <p className="text-xs text-muted-foreground">
                  Visibile a una sola azienda, nessun'altra può vederla
                </p>
              </div>
            </label>
          </RadioGroup>

          {/* Lista aziende */}
          {mode === "exclusive" ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Azienda assegnata</Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Caricamento...</p>
              ) : companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessuna azienda disponibile
                </p>
              ) : (
                <RadioGroup
                  value={exclusiveCompanyId ?? ""}
                  onValueChange={(v) => setExclusiveCompanyId(v)}
                  className="max-h-60 overflow-y-auto gap-2 rounded-lg border border-border p-3"
                >
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center gap-2">
                      <RadioGroupItem
                        value={company.id}
                        id={`excl-${company.id}`}
                      />
                      <label
                        htmlFor={`excl-${company.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {company.name}
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Aziende autorizzate</Label>
              {loading ? (
                <p className="text-sm text-muted-foreground">Caricamento...</p>
              ) : companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessuna azienda disponibile
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
                  {companies.map((company) => (
                    <div key={company.id} className="flex items-center gap-2">
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
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Puoi salvare anche senza selezionare aziende: l'esperienza resterà
                condivisa ma non attivata per nessuno.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
