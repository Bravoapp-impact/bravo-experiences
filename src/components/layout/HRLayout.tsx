import { ReactNode } from "react";
import { BarChart3, Calendar, Users, Home, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

interface HRLayoutProps {
  children: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: "Home", icon: Home, href: "/hr/home" },
  { label: "Esperienze", icon: Calendar, href: "/hr/experiences" },
  { label: "Dipendenti", icon: Users, href: "/hr/employees" },
  { label: "Report", icon: BarChart3, href: "/hr" },
];

export function HRLayout({ children }: HRLayoutProps) {
  const { profile } = useAuth();

  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      profilePath="/hr/profile"
      basePath="/hr"
      entityLogoUrl={profile?.companies?.logo_url || undefined}
      entityName={profile?.companies?.name || "Azienda"}
      separatorAfterIndex={[2]}
      dropdownItems={[
        { label: "Esplora catalogo", icon: LayoutGrid, href: "/app/experiences" },
      ]}
    >
      {children}
    </AdminLayout>
  );
}
