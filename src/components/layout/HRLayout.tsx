import { ReactNode } from "react";
import {
  BarChart3,
  Heart,
  Users,
  Home,
  LayoutGrid,
  Star,
  CalendarDays,
  Image,
  MessageSquare,
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
  // section label "Iniziative" before index 2
  { label: "Volontariato aziendale", icon: Heart, href: "/hr/volontariato", iconColor: "text-green-500" },
  { label: "Team building sociali", icon: Star, href: "/hr/team-building", iconColor: "text-orange-500" },
  // section label "Gestione" before index 4
  { label: "Calendario", icon: CalendarDays, href: "/hr/calendario", iconColor: "text-cyan-500" },
  { label: "Utenti", icon: Users, href: "/hr/users", iconColor: "text-blue-500" },
  { label: "Galleria", icon: Image, href: "/hr/galleria", iconColor: "text-amber-500" },
  { label: "Comunicazione", icon: MessageSquare, href: "/hr/comunicazione", iconColor: "text-purple-500" },
  // separator after index 7
  { label: "Report", icon: BarChart3, href: "/hr/report", iconColor: "text-rose-500" },
];

export function HRLayout({ children }: HRLayoutProps) {
  const { profile } = useAuth();

  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      profilePath="/hr/impostazioni/profilo"
      settingsPath="/hr/impostazioni/profilo"
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
