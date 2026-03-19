import { ReactNode } from "react";
import {
  Calendar,
  CalendarDays,
  History,
  Globe,
  Home,
  Briefcase,
  Users,
  GraduationCap,
  HeartHandshake,
  Gift,
  FolderKanban,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

interface AssociationLayoutProps {
  children: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: "Profilo Pubblico", icon: Globe, href: "/association/profile" },
  // separator after index 0
  { label: "Home", icon: Home, href: "/association" },
  // section label "Servizi alle aziende" before index 2
  { label: "Volontariato aziendale", icon: Briefcase, href: "/association/experiences" },
  { label: "Team Building", icon: Users, href: "#", disabled: true, badge: "Presto" },
  { label: "Formazione", icon: GraduationCap, href: "#", disabled: true, badge: "Presto" },
  { label: "Consulenza", icon: HeartHandshake, href: "#", disabled: true, badge: "Presto" },
  { label: "Gadget solidali", icon: Gift, href: "#", disabled: true, badge: "Presto" },
  { label: "Progetti", icon: FolderKanban, href: "#", disabled: true, badge: "Presto" },
  // separator after index 8
  { label: "Calendario", icon: CalendarDays, href: "/association/calendar" },
  { label: "Report", icon: History, href: "/association/history" },
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
      separatorAfterIndex={[0, 7]}
      sectionLabels={[{ beforeIndex: 2, label: "Servizi alle aziende" }]}
    >
      {children}
    </AdminLayout>
  );
}
