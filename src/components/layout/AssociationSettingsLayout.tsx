import { Outlet } from "react-router-dom";
import { ArrowLeft, User, Shield, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

const sidebarItems: SidebarItem[] = [
  { label: "Indietro", icon: ArrowLeft, href: "/association", iconColor: "text-muted-foreground" },
  // separator after 0, section "Personale" before 1
  { label: "Profilo", icon: User, href: "/association/impostazioni/profilo", iconColor: "text-violet-500" },
  // section "Sicurezza" before 2
  { label: "Password & MFA", icon: Shield, href: "/association/impostazioni/sicurezza", iconColor: "text-emerald-500" },
  // section "Organizzazione" before 3
  { label: "Profilo pubblico", icon: Globe, href: "/association/impostazioni/organizzazione", iconColor: "text-blue-500" },
];

export default function AssociationSettingsLayout() {
  const { profile } = useAuth();
  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      profilePath="/association/impostazioni/profilo"
      settingsPath="/association/impostazioni/profilo"
      basePath="/association/impostazioni"
      entityLogoUrl={(profile?.associations as any)?.logo_url || undefined}
      entityName={(profile?.associations as any)?.name || "Associazione"}
      separatorAfterIndex={[0]}
      sectionLabels={[
        { beforeIndex: 1, label: "Personale" },
        { beforeIndex: 2, label: "Sicurezza" },
        { beforeIndex: 3, label: "Organizzazione" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <Outlet />
      </div>
    </AdminLayout>
  );
}
