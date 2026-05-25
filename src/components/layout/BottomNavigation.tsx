import { Link, useLocation } from "react-router-dom";
import { Search, Sprout, User } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { BravoSymbolIcon } from "@/components/icons/BravoSymbolIcon";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  useAvatar?: boolean;
  iconScale?: string;
}

const navItems: NavItem[] = [
  { path: "/app/experiences", label: "Esplora", icon: Search },
  { path: "/app/bookings", label: "Attività", icon: BravoSymbolIcon, iconScale: "h-5 w-5" },
  { path: "/app/impact", label: "Impatto", icon: Sprout },
  { path: "/app/profile", label: "Profilo", icon: User, useAvatar: true },
];

export function BottomNavigation() {
  const location = useLocation();
  const { profile } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const getInitials = () => {
    const first = profile?.first_name?.[0] || "";
    const last = profile?.last_name?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 pb-safe md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full relative py-1.5"
            >
              <motion.div
                className="flex flex-col items-center gap-0.5"
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  {item.useAvatar && profile?.avatar_url ? (
                    <Avatar className={`h-6 w-6 ${active ? "ring-2 ring-primary ring-offset-1" : ""}`}>
                      <AvatarImage src={profile.avatar_url} alt="Avatar" />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Icon
                      className={`h-6 w-6 transition-colors ${
                        active ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
