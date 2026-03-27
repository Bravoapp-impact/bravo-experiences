import { ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

type SectionId = "profilo" | "tema" | "notifiche" | "referral"
  | "generali" | "membri" | "upgrade" | "fatturazione"
  | "volontariato" | "team-building" | "formazione" | "negozio-solidale";

interface NavItem {
  id: SectionId;
  label: string;
  path: string;
  disabled?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Personale",
    items: [
      { id: "profilo", label: "Profilo", path: "/hr/impostazioni/profilo" },
      { id: "tema", label: "Tema", path: "/hr/impostazioni/tema" },
      { id: "notifiche", label: "Notifiche", path: "", disabled: true },
      { id: "referral", label: "Referral", path: "", disabled: true },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "generali", label: "Generali", path: "/hr/impostazioni/generali" },
      { id: "membri", label: "Membri", path: "/hr/impostazioni/membri" },
      { id: "upgrade", label: "Upgrade", path: "", disabled: true },
      { id: "fatturazione", label: "Fatturazione", path: "", disabled: true },
    ],
  },
  {
    label: "Iniziative",
    items: [
      { id: "volontariato", label: "Volontariato", path: "/hr/impostazioni/volontariato" },
      { id: "team-building", label: "Team Building", path: "", disabled: true },
      { id: "formazione", label: "Formazione", path: "", disabled: true },
      { id: "negozio-solidale", label: "Negozio Solidale", path: "", disabled: true },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="space-y-4">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase mb-1 px-2">
            {group.label}
          </p>
          {group.items.map((item) =>
            item.disabled ? (
              <span
                key={item.id}
                className="block w-full text-left text-sm px-2 py-1.5 rounded-md text-muted-foreground/40 cursor-not-allowed"
              >
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "block w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors",
                    isActive || location.pathname === item.path
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </div>
      ))}
    </nav>
  );
}

export default function HRSettingsLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-border flex-col">
        <div className="p-4 pb-2">
          <Link
            to="/hr"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Indietro
          </Link>
          <h1 className="text-base font-semibold text-foreground mt-3">Impostazioni</h1>
        </div>
        <div className="px-3 py-2 flex-1 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-12 flex items-center px-3 gap-2">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0">
            <div className="p-4 pb-2">
              <Link
                to="/hr"
                onClick={() => setSheetOpen(false)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Indietro
              </Link>
              <h1 className="text-base font-semibold text-foreground mt-3">Impostazioni</h1>
            </div>
            <div className="px-3 py-2">
              <SidebarNav onNavigate={() => setSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-semibold text-foreground">Impostazioni</span>
      </div>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
