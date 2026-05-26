import { Outlet } from "react-router-dom";
import {
  User,
  Shield,
  Palette,
  Building2,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

const sidebarItems: SidebarItem[] = [
  { label: "Indietro", icon: ArrowLeft, href: "/hr", iconColor: "text-muted-foreground" },
  // separator after 0, section "Personale" before 1
  { label: "Profilo", icon: User, href: "/hr/impostazioni/profilo", iconColor: "text-violet-500" },
  { label: "Password & MFA", icon: Shield, href: "/hr/impostazioni/sicurezza", iconColor: "text-emerald-500" },
  { label: "Tema", icon: Palette, href: "/hr/impostazioni/tema", iconColor: "text-amber-500" },
  // section "Workspace" before 4
  { label: "Generali", icon: Building2, href: "/hr/impostazioni/generali", iconColor: "text-blue-500" },
  { label: "Membri", icon: Users, href: "/hr/impostazioni/membri", iconColor: "text-green-500" },
];

export default function HRSettingsLayout() {
  const { profile } = useAuth();

  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      profilePath="/hr/impostazioni/profilo"
      settingsPath="/hr/impostazioni/profilo"
      basePath="/hr/impostazioni"
      entityLogoUrl={profile?.companies?.logo_url || undefined}
      entityName={profile?.companies?.name || "Azienda"}
      separatorAfterIndex={[0]}
      sectionLabels={[
        { beforeIndex: 1, label: "Personale" },
        { beforeIndex: 4, label: "Workspace" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <Outlet />
      </div>
    </AdminLayout>
  );
}

