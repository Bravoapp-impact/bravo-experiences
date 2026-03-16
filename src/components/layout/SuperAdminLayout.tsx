import { ReactNode } from "react";
import {
  Building2,
  Calendar,
  Users,
  BarChart3,
  MapPin,
  Tag,
  Heart,
  Mail,
  KeyRound,
  Inbox,
} from "lucide-react";
import { AdminLayout, SidebarItem } from "./AdminLayout";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    icon: BarChart3,
    href: "/super-admin",
  },
  {
    label: "Aziende",
    icon: Building2,
    href: "/super-admin/companies",
  },
  {
    label: "Associazioni",
    icon: Heart,
    href: "/super-admin/associations",
  },
  {
    label: "Codici Accesso",
    icon: KeyRound,
    href: "/super-admin/access-codes",
  },
  {
    label: "Richieste Accesso",
    icon: Inbox,
    href: "/super-admin/access-requests",
  },
  {
    label: "Esperienze",
    icon: Calendar,
    href: "/super-admin/experiences",
  },
  {
    label: "Utenti",
    icon: Users,
    href: "/super-admin/users",
  },
  {
    label: "Città",
    icon: MapPin,
    href: "/super-admin/cities",
  },
  {
    label: "Categorie",
    icon: Tag,
    href: "/super-admin/categories",
  },
  {
    label: "Email Templates",
    icon: Mail,
    href: "/super-admin/email-templates",
  },
];

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      badgeLabel="Super Admin"
      profilePath="/super-admin/profile"
      basePath="/super-admin"
    >
      {children}
    </AdminLayout>
  );
}
