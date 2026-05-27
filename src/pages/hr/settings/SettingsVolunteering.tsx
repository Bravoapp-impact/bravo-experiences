import { useEffect, useState } from "react";
import { Loader2, Save, Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { devLog } from "@/lib/logger";
import SettingsPage from "@/components/common/SettingsPage";
import SettingsSection from "@/components/common/SettingsSection";
import SettingsToggleRow from "@/components/common/SettingsToggleRow";

export default function SettingsVolunteering() {
  const { profile } = useAuth();
  const [budgetHours, setBudgetHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [advanceDays, setAdvanceDays] = useState<number | null>(null);
  const [advanceDaysInput, setAdvanceDaysInput] = useState<string>("");
  const [advanceLoading, setAdvanceLoading] = useState(true);
  const [savingAdvance, setSavingAdvance] = useState(false);

  useEffect(() => {
    if (!profile?.company_id) return;
    setLoading(true);
    supabase
      .from("hour_budgets")
      .select("hours_per_employee_year")
      .eq("company_id", profile.company_id)
      .limit(1)
      .then(({ data }) => {
        setBudgetHours(data && data.length > 0 ? data[0].hours_per_employee_year : null);
        setLoading(false);
      });
  }, [profile?.company_id]);

  useEffect(() => {
    if (!profile?.company_id) return;
    setAdvanceLoading(true);
    supabase
      .from("companies")
      .select("manager_notification_advance_days")
      .eq("id", profile.company_id)
      .maybeSingle()
      .then(({ data }) => {
        const v = data?.manager_notification_advance_days ?? 7;
        setAdvanceDays(v);
        setAdvanceDaysInput(String(v));
        setAdvanceLoading(false);
      });
  }, [profile?.company_id]);

  const hasAdvanceChanges =
    advanceDaysInput !== "" &&
    Number(advanceDaysInput) !== advanceDays &&
    !Number.isNaN(Number(advanceDaysInput));

  const handleSaveAdvance = async () => {
    const n = Number(advanceDaysInput);
    if (!Number.isInteger(n) || n < 1 || n > 30) {
      toast.error("Inserisci un valore tra 1 e 30");
      return;
    }
    setSavingAdvance(true);
    try {
      const { error } = await supabase.rpc("set_manager_notification_advance_days", {
        p_days: n,
      });
      if (error) throw error;
      setAdvanceDays(n);
      toast.success("Preavviso aggiornato");
    } catch (err) {
      devLog.error("Error updating advance days:", err);
      toast.error("Errore durante il salvataggio");
    } finally {
      setSavingAdvance(false);
    }
  };

  return (
    <SettingsPage title="Volontariato aziendale" icon={Heart} iconColor="text-green-500">
      <SettingsSection title="Budget ore">
        {loading ? (
          <Skeleton className="h-8 w-40" />
        ) : budgetHours !== null ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground">{budgetHours}</span>
            <span className="text-sm text-muted-foreground">ore/anno per dipendente</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nessun limite impostato</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">Il budget è gestito dal tuo referente Bravo!</p>
      </SettingsSection>

      <SettingsSection title="Configurazione">
        <div className="space-y-4">
          <SettingsToggleRow label="I dipendenti possono prenotarsi in autonomia" defaultChecked />
          <SettingsToggleRow label="Mostra le ore nel profilo del dipendente" defaultChecked />
        </div>
      </SettingsSection>

      <SettingsSection title="Notifiche ai responsabili dei dipendenti" separator={false}>
        <p className="text-xs text-muted-foreground mb-4">
          Quando un dipendente prenota un'attività di volontariato e ha indicato l'email del proprio
          responsabile, quest'ultimo riceverà un avviso N giorni prima. Configura qui il preavviso per
          tutta l'azienda.
        </p>
        {advanceLoading ? (
          <Skeleton className="h-10 w-40" />
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="advanceDays">Giorni di preavviso al responsabile</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="advanceDays"
                  type="number"
                  min={1}
                  max={30}
                  value={advanceDaysInput}
                  onChange={(e) => setAdvanceDaysInput(e.target.value)}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">giorni</span>
              </div>
            </div>
            {hasAdvanceChanges && (
              <Button onClick={handleSaveAdvance} disabled={savingAdvance} size="sm">
                {savingAdvance ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </SettingsSection>
    </SettingsPage>
  );
}
