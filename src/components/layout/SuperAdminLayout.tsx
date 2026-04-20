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
} from "lucide-react";
import { AdminLayout, SidebarItem } from "./AdminLayout";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { label: "Home", icon: Home, href: "/super-admin/home" },
  { label: "Aziende", icon: Building2, href: "/super-admin/companies" },
  { label: "Associazioni", icon: Heart, href: "/super-admin/associations" },
  { label: "Esperienze", icon: Calendar, href: "/super-admin/experiences" },
  { label: "Utenti", icon: Users, href: "/super-admin/users" },
  { label: "Codici Accesso", icon: KeyRound, href: "/super-admin/access-codes" },
  { label: "Richieste Accesso", icon: Inbox, href: "/super-admin/access-requests" },
  { label: "Città", icon: MapPin, href: "/super-admin/cities" },
  { label: "Categorie", icon: Tag, href: "/super-admin/categories" },
  { label: "Email per azienda", icon: Mail, href: "/super-admin/email-settings" },
];

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      profilePath="/super-admin/profile"
      basePath="/super-admin"
      entityName="Bravo! Team"
      sectionLabels={[
        { beforeIndex: 1, label: "Marketplace" },
        { beforeIndex: 5, label: "Configurazione" },
      ]}
    >
      {children}
    </AdminLayout>
  );
}
