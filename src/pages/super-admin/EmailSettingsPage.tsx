import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/logger";
import PageSection from "@/components/common/PageSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Building2,
  CheckCircle,
  Bell,
  Clock,
  Save,
  Loader2,
} from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface EmailSettings {
  id?: string;
  company_id: string;
  confirmation_enabled: boolean;
  reminder_enabled: boolean;
  reminder_hours_before: number;
}

export default function EmailSettingsPage() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<EmailSettings>({
    company_id: "",
    confirmation_enabled: true,
    reminder_enabled: true,
    reminder_hours_before: 24,
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");

      if (error) {
        devLog.error("Error fetching companies:", error);
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Impossibile caricare le aziende",
        });
        return;
      }

      setCompanies(data || []);
      if (data && data.length > 0) {
        setSelectedCompanyId(data[0].id);
      }
      setLoading(false);
    };

    fetchCompanies();
  }, [toast]);

  useEffect(() => {
    if (!selectedCompanyId) return;

    const fetchData = async () => {
      setLoading(true);

      const { data: settingsData } = await supabase
        .from("email_settings")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .single();

      if (settingsData) {
        setSettings(settingsData);
      } else {
        setSettings({
          company_id: selectedCompanyId,
          confirmation_enabled: true,
          reminder_enabled: true,
          reminder_hours_before: 24,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [selectedCompanyId]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const settingsToSave = {
        ...settings,
        company_id: selectedCompanyId,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("email_settings")
          .update({
            confirmation_enabled: settingsToSave.confirmation_enabled,
            reminder_enabled: settingsToSave.reminder_enabled,
            reminder_hours_before: settingsToSave.reminder_hours_before,
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("email_settings")
          .insert(settingsToSave)
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
      }

      toast({
        title: "Impostazioni salvate",
        description: "Le impostazioni email sono state aggiornate",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile salvare le impostazioni",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Impostazioni email per azienda
            </h1>
            <p className="text-muted-foreground mt-1">
              Attiva o disattiva le email transazionali e configura il timing dei reminder
            </p>
          </div>
        </div>

        <PageSection
          title={
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-bravo-purple" />
              Seleziona Azienda
            </span>
          }
        >
          {loading && companies.length === 0 ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedCompanyId}
              onValueChange={setSelectedCompanyId}
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Seleziona un'azienda" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </PageSection>

        {selectedCompanyId && (
          <PageSection
            title={
              <span className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-bravo-purple" />
                Impostazioni Email
                {selectedCompany && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedCompany.name}
                  </Badge>
                )}
              </span>
            }
            description="Configura quali email inviare e quando"
          >
            <div className="space-y-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-success/10">
                        <CheckCircle className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">Email di Conferma</p>
                        <p className="text-sm text-muted-foreground">
                          Invia una email quando un dipendente prenota un'esperienza
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.confirmation_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, confirmation_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bravo-orange/10">
                        <Bell className="h-5 w-5 text-bravo-orange" />
                      </div>
                      <div>
                        <p className="font-medium">Email di Reminder</p>
                        <p className="text-sm text-muted-foreground">
                          Invia un promemoria prima dell'esperienza
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.reminder_enabled}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, reminder_enabled: checked })
                      }
                    />
                  </div>

                  {settings.reminder_enabled && (
                    <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
                      <div className="p-2 rounded-lg bg-bravo-orange/10">
                        <Clock className="h-5 w-5 text-bravo-orange" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="reminder-hours">
                          Ore prima dell'esperienza
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Quando inviare il promemoria
                        </p>
                      </div>
                      <Select
                        value={settings.reminder_hours_before.toString()}
                        onValueChange={(value) =>
                          setSettings({
                            ...settings,
                            reminder_hours_before: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12 ore</SelectItem>
                          <SelectItem value="24">24 ore</SelectItem>
                          <SelectItem value="48">48 ore</SelectItem>
                          <SelectItem value="72">72 ore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salva Impostazioni
                  </Button>
                </>
              )}
            </div>
          </PageSection>
        )}
      </div>
    </SuperAdminLayout>
  );
}
