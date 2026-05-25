import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";

interface ImpactKpi {
  id: string;
  label: string;
  sort_order: number;
}

interface ExperienceDate {
  id: string;
  experience_id: string;
  start_datetime: string;
  end_datetime: string;
  max_participants: number;
  volunteer_hours: number | null;
  beneficiaries_count: number | null;
  company_id: string | null;
}

interface ExperienceDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experienceId: string;
  experienceDate: ExperienceDate | null;
  onSaved: () => void;
}

type AvailabilityMode = "all" | "single";

interface CompanyOption {
  id: string;
  name: string;
}

export function ExperienceDateDialog({
  open,
  onOpenChange,
  experienceId,
  experienceDate,
  onSaved,
}: ExperienceDateDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    max_participants: 10,
    volunteer_hours: 2,
    beneficiaries_count: 0,
  });
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [activatedCompanies, setActivatedCompanies] = useState<CompanyOption[]>([]);
  const [loadingScope, setLoadingScope] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (experienceDate) {
      const startDate = new Date(experienceDate.start_datetime);
      const endDate = new Date(experienceDate.end_datetime);
      setFormData({
        start_date: startDate.toISOString().split("T")[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: endDate.toISOString().split("T")[0],
        end_time: endDate.toTimeString().slice(0, 5),
        max_participants: experienceDate.max_participants,
        volunteer_hours: experienceDate.volunteer_hours || 2,
        beneficiaries_count: experienceDate.beneficiaries_count || 0,
      });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        start_date: tomorrow.toISOString().split("T")[0],
        start_time: "09:00",
        end_date: tomorrow.toISOString().split("T")[0],
        end_time: "12:00",
        max_participants: 10,
        volunteer_hours: 3,
        beneficiaries_count: 0,
      });
    }
  }, [experienceDate, open]);

  // Fetch visibility + activated companies when dialog opens
  useEffect(() => {
    if (!open || !experienceId) return;

    let cancelled = false;
    setLoadingScope(true);

    (async () => {
      try {
        const [expRes, ecRes] = await Promise.all([
          supabase
            .from("experiences")
            .select("visibility")
            .eq("id", experienceId)
            .maybeSingle(),
          supabase
            .from("experience_companies")
            .select("company_id, companies:company_id (id, name)")
            .eq("experience_id", experienceId),
        ]);

        if (cancelled) return;

        const vis = (expRes.data?.visibility === "private" ? "private" : "public") as
          | "public"
          | "private";
        setVisibility(vis);

        const companies: CompanyOption[] = (ecRes.data ?? [])
          .map((row: any) => row.companies)
          .filter((c: any): c is CompanyOption => !!c && !!c.id && !!c.name)
          .sort((a, b) => a.name.localeCompare(b.name));
        setActivatedCompanies(companies);

        // Initialize mode/selection
        const existingCompanyId = experienceDate?.company_id ?? null;
        if (vis === "private") {
          setAvailabilityMode("single");
          setSelectedCompanyId(existingCompanyId ?? companies[0]?.id ?? "");
        } else if (existingCompanyId) {
          setAvailabilityMode("single");
          setSelectedCompanyId(existingCompanyId);
        } else {
          setAvailabilityMode("all");
          setSelectedCompanyId("");
        }
      } catch (e) {
        devLog.error("Error loading experience scope:", e);
      } finally {
        if (!cancelled) setLoadingScope(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, experienceId, experienceDate]);

  const handleSave = async () => {
    if (!formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
      });
      return;
    }

    const startDatetime = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDatetime = new Date(`${formData.end_date}T${formData.end_time}`);

    if (endDatetime <= startDatetime) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "La data/ora di fine deve essere successiva all'inizio",
      });
      return;
    }

    if (availabilityMode === "single" && !selectedCompanyId) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Seleziona l'azienda a cui riservare la data",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        experience_id: experienceId,
        start_datetime: startDatetime.toISOString(),
        end_datetime: endDatetime.toISOString(),
        max_participants: formData.max_participants,
        volunteer_hours: formData.volunteer_hours,
        beneficiaries_count: formData.beneficiaries_count,
        company_id: availabilityMode === "single" ? selectedCompanyId : null,
      };

      if (experienceDate) {
        const { error } = await supabase
          .from("experience_dates")
          .update(payload)
          .eq("id", experienceDate.id);

        if (error) throw error;

        toast({
          title: "Successo",
          description: "Data aggiornata",
        });
      } else {
        const { error } = await supabase.from("experience_dates").insert(payload);

        if (error) throw error;

        toast({
          title: "Successo",
          description: "Data creata",
        });
      }

      onSaved();
    } catch (error: any) {
      devLog.error("Error saving experience date:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile salvare la data",
      });
    } finally {
      setSaving(false);
    }
  };

  const noCompaniesActivated = activatedCompanies.length === 0;
  const singleDisabledForPublic = visibility === "public" && noCompaniesActivated;
  const radioLocked = visibility === "private";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>
            {experienceDate ? "Modifica Data" : "Nuova Data"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Inizio *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Ora Inizio *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">Data Fine *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Ora Fine *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Disponibile a</Label>
            <RadioGroup
              value={availabilityMode}
              onValueChange={(v) => {
                if (radioLocked) return;
                setAvailabilityMode(v as AvailabilityMode);
                if (v === "all") setSelectedCompanyId("");
              }}
              disabled={loadingScope || radioLocked}
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem
                  value="all"
                  id="avail-all"
                  disabled={radioLocked}
                  className="mt-0.5"
                />
                <Label htmlFor="avail-all" className="font-normal cursor-pointer">
                  Tutte le aziende che hanno l'esperienza
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem
                  value="single"
                  id="avail-single"
                  disabled={singleDisabledForPublic}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="avail-single"
                  className={`font-normal cursor-pointer ${singleDisabledForPublic ? "opacity-50" : ""}`}
                >
                  Solo una specifica azienda
                </Label>
              </div>
            </RadioGroup>

            {singleDisabledForPublic && (
              <p className="text-xs text-muted-foreground">
                Attiva prima questa esperienza per almeno un'azienda dal dialog visibilità
              </p>
            )}

            {availabilityMode === "single" && !singleDisabledForPublic && (
              <Select
                value={selectedCompanyId}
                onValueChange={setSelectedCompanyId}
                disabled={radioLocked || activatedCompanies.length <= 1 && radioLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona azienda" />
                </SelectTrigger>
                <SelectContent>
                  {activatedCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_participants">Posti Massimi *</Label>
            <Input
              id="max_participants"
              type="number"
              min={1}
              value={formData.max_participants}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_participants: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volunteer_hours">Ore Volontariato</Label>
              <Input
                id="volunteer_hours"
                type="number"
                min={0}
                step={0.5}
                value={formData.volunteer_hours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    volunteer_hours: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaries_count">Beneficiari</Label>
              <Input
                id="beneficiaries_count"
                type="number"
                min={0}
                value={formData.beneficiaries_count}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    beneficiaries_count: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving || loadingScope}>
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
