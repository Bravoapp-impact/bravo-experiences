import { ReactNode } from "react";
import {
  BarChart3,
  Heart,
  Users,
  LayoutGrid,
  CalendarDays,
  Image,
  Lightbulb,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

interface HRLayoutProps {
  children: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: "Esplora l'app", icon: LayoutGrid, href: "/app/experiences", iconColor: "text-slate-500" },
  // separator after index 0
  // section label "Iniziative" before index 1
  { label: "Volontariato aziendale", icon: Heart, href: "/hr/volontariato", iconColor: "text-green-500" },
  // section label "Gestione" before index 2
  { label: "Calendario", icon: CalendarDays, href: "/hr/calendario", iconColor: "text-cyan-500" },
  { label: "Utenti", icon: Users, href: "/hr/users", iconColor: "text-blue-500" },
  { label: "Galleria", icon: Image, href: "/hr/galleria", iconColor: "text-amber-500" },
  { label: "ETS Suggeriti", icon: Lightbulb, href: "/hr/ets-suggeriti", iconColor: "text-yellow-500" },
  // separator after index 6
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
      separatorAfterIndex={[0, 6]}
      sectionLabels={[
        { beforeIndex: 1, label: "Iniziative" },
        { beforeIndex: 3, label: "Gestione" },
      ]}
    >
      {children}
    </AdminLayout>
  );
}
