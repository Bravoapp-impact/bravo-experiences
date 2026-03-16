import { ReactNode } from "react";
import { Calendar, CalendarDays, History, Globe, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

interface AssociationLayoutProps {
  children: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: "Pagina Host", icon: Globe, href: "/association/profile" },
  { label: "Home", icon: Home, href: "/association/home" },
  { label: "Esperienze", icon: Calendar, href: "/association/experiences" },
  { label: "Calendario", icon: CalendarDays, href: "/association/calendar" },
  { label: "Storico", icon: History, href: "/association/history" },
];

export function AssociationLayout({ children }: AssociationLayoutProps) {
  const { profile } = useAuth();

  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      profilePath="/association/my-profile"
      basePath="/association"
      entityLogoUrl={(profile?.associations as any)?.logo_url || undefined}
      entityName={(profile?.associations as any)?.name || "Associazione"}
      separatorAfterIndex={[0]}
    >
      {children}
    </AdminLayout>
  );
}
