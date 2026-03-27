import { ReactNode } from "react";
import {
  BarChart3,
  Calendar,
  Users,
  Home,
  LayoutGrid,
  Briefcase,
  GraduationCap,
  ShoppingBag,
  CalendarDays,
  Image,
  MessageSquare,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

interface HRLayoutProps {
  children: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: "Esplora catalogo", icon: LayoutGrid, href: "/app/experiences", iconColor: "text-slate-500" },
  // separator after index 0
  { label: "Home", icon: Home, href: "/hr", iconColor: "text-violet-500" },
  // section label "Iniziative" before index 3
  { label: "Volontariato aziendale", icon: Calendar, href: "/hr/volontariato", iconColor: "text-green-500" },
  { label: "Team building sociali", icon: Briefcase, href: "#", disabled: true, badge: "Presto" },
  { label: "Formazione", icon: GraduationCap, href: "#", disabled: true, badge: "Presto" },
  { label: "Negozio solidale", icon: ShoppingBag, href: "#", disabled: true, badge: "Presto" },
  // section label "Gestione" before index 7
  { label: "Calendario", icon: CalendarDays, href: "#", disabled: true, badge: "Presto" },
  { label: "Utenti", icon: Users, href: "/hr/users", iconColor: "text-blue-500" },
  { label: "Galleria", icon: Image, href: "#", disabled: true, badge: "Presto" },
  { label: "Comunicazione", icon: MessageSquare, href: "#", disabled: true, badge: "Presto" },
  // separator after index 10
  { label: "Report", icon: BarChart3, href: "/hr/report", iconColor: "text-rose-500" },
  { label: "Impostazioni", icon: Settings, href: "/hr/impostazioni", iconColor: "text-slate-500" },
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
      separatorAfterIndex={[0, 10]}
      sectionLabels={[
        { beforeIndex: 2, label: "Iniziative" },
        { beforeIndex: 7, label: "Gestione" },
      ]}
    >
      {children}
    </AdminLayout>
  );
}
