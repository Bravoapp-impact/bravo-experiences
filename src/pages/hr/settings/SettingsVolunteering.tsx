import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h2 className="text-lg font-semibold text-foreground">Volontariato aziendale</h2>
      <p className="text-sm text-muted-foreground mb-6">Configurazione del programma di volontariato</p>

      <h3 className="text-sm font-semibold text-foreground mb-3">Budget ore</h3>
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

      <Separator className="my-6" />

      <h3 className="text-sm font-semibold text-foreground mb-3">Configurazione</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">I dipendenti possono prenotarsi in autonomia</Label>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-sm">Mostra le ore nel profilo del dipendente</Label>
          <Switch defaultChecked />
        </div>
      </div>
    </motion.div>
  );
}
