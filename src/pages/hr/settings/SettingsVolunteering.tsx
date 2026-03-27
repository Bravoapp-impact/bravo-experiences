import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsPage from "@/components/common/SettingsPage";
import SettingsSection from "@/components/common/SettingsSection";
import SettingsToggleRow from "@/components/common/SettingsToggleRow";

export default function SettingsVolunteering() {
  const { profile } = useAuth();
  const [budgetHours, setBudgetHours] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <SettingsPage title="Volontariato aziendale" description="Configurazione del programma di volontariato">
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

      <SettingsSection title="Configurazione" separator={false}>
        <div className="space-y-4">
          <SettingsToggleRow label="I dipendenti possono prenotarsi in autonomia" defaultChecked />
          <SettingsToggleRow label="Mostra le ore nel profilo del dipendente" defaultChecked />
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
