import { useNavigate } from "react-router-dom";
import { ArrowRight, Globe } from "lucide-react";
import SettingsPage from "@/components/common/SettingsPage";
import SettingsSection from "@/components/common/SettingsSection";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export default function AssociationSettingsOrganization() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const associationName = (profile?.associations as any)?.name || "la tua associazione";

  return (
    <SettingsPage
      title="Organizzazione"
      description="Gestisci il profilo pubblico della tua associazione"
    >
      <SettingsSection title="Profilo pubblico" separator={false}>
        <div className="rounded-lg border bg-card p-4 flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-foreground">
              Modifica le informazioni che le aziende vedono di {associationName}: descrizione,
              logo, città, contatti e categorie di attività.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/association/profile")}
            >
              Apri profilo pubblico
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
