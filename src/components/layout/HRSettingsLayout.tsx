import { Outlet } from "react-router-dom";
import {
  User,
  Shield,
  Palette,
  Bell,
  Gift,
  Building2,
  Users,
  Zap,
  Receipt,
  Heart,
  UsersRound,
  GraduationCap,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout, SidebarItem } from "./AdminLayout";

const sidebarItems: SidebarItem[] = [
  { label: "Indietro", icon: ArrowLeft, href: "/hr", iconColor: "text-muted-foreground" },
  // separator after 0, section "Personale" before 1
  { label: "Profilo", icon: User, href: "/hr/impostazioni/profilo", iconColor: "text-violet-500" },
  { label: "Password & MFA", icon: Shield, href: "/hr/impostazioni/sicurezza", iconColor: "text-emerald-500" },
  { label: "Tema", icon: Palette, href: "/hr/impostazioni/tema", iconColor: "text-amber-500" },
  { label: "Notifiche", icon: Bell, href: "#", disabled: true, badge: "Presto" },
  { label: "Referral", icon: Gift, href: "#", disabled: true, badge: "Presto" },
  // section "Workspace" before 6
  { label: "Generali", icon: Building2, href: "/hr/impostazioni/generali", iconColor: "text-blue-500" },
  { label: "Membri", icon: Users, href: "/hr/impostazioni/membri", iconColor: "text-green-500" },
  { label: "Upgrade", icon: Zap, href: "#", disabled: true, badge: "Presto" },
  { label: "Fatturazione", icon: Receipt, href: "#", disabled: true, badge: "Presto" },
  // section "Iniziative" before 10
  { label: "Volontariato", icon: Heart, href: "/hr/impostazioni/volontariato", iconColor: "text-rose-500" },
  { label: "Team Building", icon: UsersRound, href: "#", disabled: true, badge: "Presto" },
  { label: "Formazione", icon: GraduationCap, href: "#", disabled: true, badge: "Presto" },
  { label: "Negozio Solidale", icon: ShoppingBag, href: "#", disabled: true, badge: "Presto" },
];

export default function HRSettingsLayout() {
  const { profile } = useAuth();

  return (
    <AdminLayout
      sidebarItems={sidebarItems}
      profilePath="/hr/impostazioni/profilo"
      settingsPath="/hr/impostazioni/profilo"
      basePath="/hr/impostazioni"
      entityLogoUrl={profile?.companies?.logo_url || undefined}
      entityName={profile?.companies?.name || "Azienda"}
      separatorAfterIndex={[0]}
      sectionLabels={[
        { beforeIndex: 1, label: "Personale" },
        { beforeIndex: 6, label: "Workspace" },
        { beforeIndex: 10, label: "Iniziative" },
      ]}
    >
      <div className="max-w-4xl mx-auto">
        <Outlet />
      </div>
    </AdminLayout>
  );
}

