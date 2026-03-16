import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertCircle,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface EmailTemplate {
  id?: string;
  company_id: string;
  template_type: "booking_confirmation" | "booking_reminder";
  subject: string;
  intro_text: string;
  closing_text: string;
}

export default function EmailTemplatesPage() {
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

  const [confirmationTemplate, setConfirmationTemplate] = useState<EmailTemplate>({
    company_id: "",
    template_type: "booking_confirmation",
    subject: "",
    intro_text: "",
    closing_text: "",
  });

  const [reminderTemplate, setReminderTemplate] = useState<EmailTemplate>({
    company_id: "",
    template_type: "booking_reminder",
    subject: "",
    intro_text: "",
    closing_text: "",
  });

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching companies:", error);
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

  // Fetch settings and templates when company changes
  useEffect(() => {
    if (!selectedCompanyId) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch email settings
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

      // Fetch confirmation template
      const { data: confirmData } = await supabase
        .from("email_templates")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .eq("template_type", "booking_confirmation")
        .single();

      if (confirmData) {
        setConfirmationTemplate({
          ...confirmData,
          template_type: "booking_confirmation" as const,
        });
      } else {
        setConfirmationTemplate({
          company_id: selectedCompanyId,
          template_type: "booking_confirmation",
          subject: "",
          intro_text: "",
          closing_text: "",
        });
      }

      // Fetch reminder template
      const { data: reminderData } = await supabase
        .from("email_templates")
        .select("*")
        .eq("company_id", selectedCompanyId)
        .eq("template_type", "booking_reminder")
        .single();

      if (reminderData) {
        setReminderTemplate({
          ...reminderData,
          template_type: "booking_reminder" as const,
        });
      } else {
        setReminderTemplate({
          company_id: selectedCompanyId,
          template_type: "booking_reminder",
          subject: "",
          intro_text: "",
          closing_text: "",
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
        // Update existing
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
        // Insert new
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

  const handleSaveTemplate = async (type: "booking_confirmation" | "booking_reminder") => {
    setSaving(true);
    try {
      const template = type === "booking_confirmation" ? confirmationTemplate : reminderTemplate;
      const templateToSave = {
        ...template,
        company_id: selectedCompanyId,
        template_type: type,
      };

      if (template.id) {
        // Update existing
        const { error } = await supabase
          .from("email_templates")
          .update({
            subject: templateToSave.subject,
            intro_text: templateToSave.intro_text,
            closing_text: templateToSave.closing_text,
          })
          .eq("id", template.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("email_templates")
          .insert(templateToSave)
          .select()
          .single();

        if (error) throw error;
        
        if (type === "booking_confirmation") {
          setConfirmationTemplate({
            ...data,
            template_type: "booking_confirmation" as const,
          });
        } else {
          setReminderTemplate({
            ...data,
            template_type: "booking_reminder" as const,
          });
        }
      }

      toast({
        title: "Template salvato",
        description: `Il template ${type === "booking_confirmation" ? "di conferma" : "di reminder"} è stato aggiornato`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile salvare il template",
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Template Email
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestisci le email inviate ai dipendenti per ogni azienda
            </p>
          </div>
        </div>

        {/* Company Selector */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-bravo-purple" />
              Seleziona Azienda
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {selectedCompanyId && (
          <>
            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-5 w-5 text-bravo-purple" />
                  Impostazioni Email
                  {selectedCompany && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedCompany.name}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Configura quali email inviare e quando
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <>
                    {/* Confirmation Email Toggle */}
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

                    {/* Reminder Email Toggle */}
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

                    {/* Reminder Hours */}
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
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contenuto Email</CardTitle>
                <CardDescription>
                  Personalizza il testo delle email per questa azienda. I dettagli
                  dell'esperienza vengono inseriti automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="confirmation" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="confirmation" className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Conferma</span>
                    </TabsTrigger>
                    <TabsTrigger value="reminder" className="gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="hidden sm:inline">Reminder</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Confirmation Template */}
                  <TabsContent value="confirmation" className="space-y-4 mt-4">
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-subject">Oggetto</Label>
                          <Input
                            id="confirm-subject"
                            placeholder="es. Conferma prenotazione: {{titolo_esperienza}}"
                            value={confirmationTemplate.subject}
                            onChange={(e) =>
                              setConfirmationTemplate({
                                ...confirmationTemplate,
                                subject: e.target.value,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Lascia vuoto per usare il default
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="confirm-intro">Testo Introduttivo</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Questo testo appare prima dei dettagli dell'esperienza
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Textarea
                            id="confirm-intro"
                            placeholder="es. Ciao! La tua prenotazione è stata confermata con successo..."
                            rows={4}
                            value={confirmationTemplate.intro_text}
                            onChange={(e) =>
                              setConfirmationTemplate({
                                ...confirmationTemplate,
                                intro_text: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="confirm-closing">Testo di Chiusura</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Questo testo appare dopo i dettagli dell'esperienza
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Textarea
                            id="confirm-closing"
                            placeholder="es. Ti aspettiamo! Grazie per il tuo impegno..."
                            rows={4}
                            value={confirmationTemplate.closing_text}
                            onChange={(e) =>
                              setConfirmationTemplate({
                                ...confirmationTemplate,
                                closing_text: e.target.value,
                              })
                            }
                          />
                        </div>

                        <Button
                          onClick={() => handleSaveTemplate("booking_confirmation")}
                          disabled={saving}
                          className="w-full sm:w-auto"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Salva Template Conferma
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  {/* Reminder Template */}
                  <TabsContent value="reminder" className="space-y-4 mt-4">
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="reminder-subject">Oggetto</Label>
                          <Input
                            id="reminder-subject"
                            placeholder="es. Promemoria: {{titolo_esperienza}} - Domani!"
                            value={reminderTemplate.subject}
                            onChange={(e) =>
                              setReminderTemplate({
                                ...reminderTemplate,
                                subject: e.target.value,
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Lascia vuoto per usare il default
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="reminder-intro">Testo Introduttivo</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Questo testo appare prima dei dettagli dell'esperienza
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Textarea
                            id="reminder-intro"
                            placeholder="es. Ti ricordiamo che domani hai un'esperienza di volontariato..."
                            rows={4}
                            value={reminderTemplate.intro_text}
                            onChange={(e) =>
                              setReminderTemplate({
                                ...reminderTemplate,
                                intro_text: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="reminder-closing">Testo di Chiusura</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Questo testo appare dopo i dettagli dell'esperienza
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <Textarea
                            id="reminder-closing"
                            placeholder="es. Non vediamo l'ora di vederti! Grazie per il tuo impegno..."
                            rows={4}
                            value={reminderTemplate.closing_text}
                            onChange={(e) =>
                              setReminderTemplate({
                                ...reminderTemplate,
                                closing_text: e.target.value,
                              })
                            }
                          />
                        </div>

                        <Button
                          onClick={() => handleSaveTemplate("booking_reminder")}
                          disabled={saving}
                          className="w-full sm:w-auto"
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Salva Template Reminder
                        </Button>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card className="border-bravo-purple/20 bg-bravo-purple/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-bravo-purple shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-bravo-purple">
                      Come funzionano le email
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>
                        • <strong>Email di conferma:</strong> Inviata automaticamente quando un dipendente prenota un'esperienza
                      </li>
                      <li>
                        • <strong>Email di reminder:</strong> Inviata automaticamente X ore prima dell'esperienza (in base alle impostazioni)
                      </li>
                      <li>
                        • I dettagli dell'esperienza (titolo, data, orario, luogo) vengono inseriti automaticamente
                      </li>
                      <li>
                        • Se lasci i campi vuoti, verranno usati i testi predefiniti
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}