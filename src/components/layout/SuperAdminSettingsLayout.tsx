import { Outlet } from "react-router-dom";
import { ArrowLeft, User, Shield } from "lucide-react";
import { AdminLayout, SidebarItem } from "./AdminLayout";

const sidebarItems: SidebarItem[] = [
  { label: "Indietro", icon: ArrowLeft, href: "/super-admin", iconColor: "text-muted-foreground" },
  // separator after 0, section "Personale" before 1
  { label: "Profilo", icon: User, href: "/super-admin/impostazioni/profilo", iconColor: "text-violet-500" },
  // section "Sicurezza" before 2
  { label: "Password & MFA", icon: Shield, href: "/super-admin/impostazioni/sicurezza", iconColor: "text-emerald-500" },
];

export default function SuperAdminSettingsLayout() {
  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      profilePath="/super-admin/impostazioni/profilo"
      settingsPath="/super-admin/impostazioni/profilo"
      basePath="/super-admin/impostazioni"
      entityName="Bravo! Team"
      separatorAfterIndex={[0]}
      sectionLabels={[
        { beforeIndex: 1, label: "Personale" },
        { beforeIndex: 2, label: "Sicurezza" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <Outlet />
      </div>
    </AdminLayout>
  );
}
