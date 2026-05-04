import { ReactNode } from "react";
import {
  BarChart3,
  Heart,
  Users,
  Home,
  LayoutGrid,
  Star,
  GraduationCap,
  ShoppingBag,
  Ticket,
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
  { label: "Formazione", icon: GraduationCap, href: "#", disabled: true, badge: "Presto" },
  { label: "Negozio solidale", icon: ShoppingBag, href: "#", disabled: true, badge: "Presto" },
  // section label "Gestione" before index 6
  { label: "Calendario", icon: CalendarDays, href: "#", disabled: true, badge: "Presto" },
  { label: "Utenti", icon: Users, href: "/hr/users", iconColor: "text-blue-500" },
  { label: "Galleria", icon: Image, href: "#", disabled: true, badge: "Presto" },
  { label: "Comunicazione", icon: MessageSquare, href: "#", disabled: true, badge: "Presto" },
  // separator after index 9
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
      separatorAfterIndex={[0, 9]}
      sectionLabels={[
        { beforeIndex: 2, label: "Iniziative" },
        { beforeIndex: 6, label: "Gestione" },
      ]}
    >
      {children}
    </AdminLayout>
  );
}
