import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  User,
  Menu,
  X,
  Settings,
  ChevronsUpDown,
  LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export interface AdminLayoutProps {
  children: ReactNode;
  sidebarItems: SidebarItem[];
  profilePath: string;
  basePath: string;
  entityLogoUrl?: string;
  entityName?: string;
  dropdownItems?: { label: string; icon: LucideIcon; href?: string; onClick?: () => void }[];
  sectionLabels?: { beforeIndex: number; label: string }[];
  separatorAfterIndex?: number[];
}

function getGreeting(gender: string | null | undefined): string {
  if (gender === "male") return "Bravo";
  if (gender === "female") return "Brava";
  return "Bravə";
}

function getEntityInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminLayout({
  children,
  sidebarItems,
  profilePath,
  basePath,
  entityLogoUrl,
  entityName,
  dropdownItems,
  sectionLabels,
  separatorAfterIndex,
}: AdminLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const greeting = getGreeting((profile as any)?.gender);
  const firstName = profile?.first_name || "";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === basePath) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const sectionLabelMap = new Map(
    (sectionLabels || []).map((s) => [s.beforeIndex, s.label])
  );
  const separatorSet = new Set(separatorAfterIndex || []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 border-r border-border/50 bg-card/95 backdrop-blur-md transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Unified header with dropdown */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 h-auto py-2 px-2"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={entityLogoUrl} alt={entityName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                      {getEntityInitials(entityName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left overflow-hidden flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {greeting}, {firstName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entityName}
                    </p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-popover">
                <DropdownMenuItem
                  onClick={() => navigate(profilePath)}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profilo personale
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate(`${basePath}/settings`)}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Impostazioni
                </DropdownMenuItem>
                {dropdownItems?.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      else if (item.href) navigate(item.href);
                    }}
                    className="cursor-pointer"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0 ml-1"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-5rem)] px-3">
          <nav className="space-y-0.5">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const sectionLabel = sectionLabelMap.get(index);

              return (
                <div key={item.href}>
                  {sectionLabel && (
                    <div className="px-3 pt-3 pb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-medium">
                        {sectionLabel}
                      </span>
                    </div>
                  )}
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                  {separatorSet.has(index) && (
                    <div className="mx-3 my-1.5 h-px bg-border/20" />
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 bg-background/80 backdrop-blur-md px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
