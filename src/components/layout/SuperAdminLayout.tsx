import { ReactNode } from "react";
import {
  Building2,
  Calendar,
  Users,
  MapPin,
  Tag,
  Heart,
  Mail,
  KeyRound,
  Inbox,
  Home,
  LayoutGrid,
  ClipboardList,
} from "lucide-react";
import { AdminLayout, SidebarItem, SidebarSection } from "./AdminLayout";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const topItems: SidebarItem[] = [
  { label: "Home", icon: Home, href: "/super-admin" },
];

const sections: SidebarSection[] = [
  {
    label: "Entità",
    defaultOpen: true,
    items: [
      { label: "Aziende", icon: Building2, href: "/super-admin/companies" },
      { label: "Associazioni", icon: Heart, href: "/super-admin/associations" },
      { label: "Utenti", icon: Users, href: "/super-admin/users" },
    ],
  },
  {
    label: "Volontariato Aziendale",
    defaultOpen: true,
    items: [
      { label: "Esperienze", icon: Calendar, href: "/super-admin/experiences" },
    ],
  },
  {
    label: "Team Building",
    defaultOpen: true,
    items: [
      { label: "Catalogo TB", icon: LayoutGrid, href: "/super-admin/team-building/formats" },
      { label: "Richieste TB", icon: ClipboardList, href: "/super-admin/team-building/richieste" },
    ],
  },
  {
    label: "Configurazione",
    defaultOpen: false,
    items: [
      { label: "Codici Accesso", icon: KeyRound, href: "/super-admin/access-codes" },
      { label: "Richieste Accesso", icon: Inbox, href: "/super-admin/access-requests" },
      { label: "Città", icon: MapPin, href: "/super-admin/cities" },
      { label: "Categorie", icon: Tag, href: "/super-admin/categories" },
      { label: "Email per azienda", icon: Mail, href: "/super-admin/email-settings" },
    ],
  },
];

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <AdminLayout
      topItems={topItems}
      sections={sections}
      profilePath="/super-admin/impostazioni/profilo"
      settingsPath="/super-admin/impostazioni/profilo"
      basePath="/super-admin"
      entityName="Bravo! Team"
    >
      {children}
    </AdminLayout>
  );
}
