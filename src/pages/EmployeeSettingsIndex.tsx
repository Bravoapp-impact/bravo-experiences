import { Link } from "react-router-dom";
import { ArrowLeft, User, Shield, Bell } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsListItem } from "@/components/settings/SettingsListItem";

export default function EmployeeSettingsIndex() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto pb-20 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/app/profile"
            aria-label="Indietro"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-muted hover:bg-muted/70 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-6">Impostazioni</h1>
        <div>
          <SettingsListItem
            icon={User}
            title="Informazioni personali"
            description="Nome, email, azienda"
            to="/app/impostazioni/personali"
            iconColor="text-blue-500"
          />
          <SettingsListItem
            icon={Shield}
            title="Accesso e sicurezza"
            description="Password, autenticazione a due fattori"
            to="/app/impostazioni/sicurezza"
            iconColor="text-green-500"
          />
          <SettingsListItem
            icon={Bell}
            title="Notifiche"
            description="Email del responsabile"
            to="/app/impostazioni/notifiche"
            iconColor="text-orange-500"
          />

        </div>
      </div>
    </AppLayout>
  );
}
