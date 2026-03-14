import { ReactNode } from "react";
import { Calendar, CalendarDays, BarChart3, History, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

interface AssociationLayoutProps {
  children: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    icon: BarChart3,
    href: "/association",
  },
  {
    label: "Esperienze",
    icon: Calendar,
    href: "/association/experiences",
  },
  {
    label: "Calendario",
    icon: CalendarDays,
    href: "/association/calendar",
  },
  {
    label: "Storico",
    icon: History,
    href: "/association/history",
  },
  {
    label: "Profilo",
    icon: Building,
    href: "/association/profile",
  },
];

export function AssociationLayout({ children }: AssociationLayoutProps) {
  const { profile } = useAuth();
  const associationName = profile?.associations?.name || "Associazione";

  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      badgeLabel="Associazione"
      profilePath="/association/my-profile"
      basePath="/association"
      entityName={associationName}
    >
      {children}
    </AdminLayout>
  );
}
