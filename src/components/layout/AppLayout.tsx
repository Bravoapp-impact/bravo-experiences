import { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Search, Calendar, Sprout, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNavigation } from "./BottomNavigation";
import bravoLogo from "@/assets/bravo-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const companyLogo = profile?.companies?.logo_url;
  const companyName = profile?.companies?.name;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 md:h-16 items-center justify-between">
          {/* Left: Bravo! logo + Company logo */}
          <div className="flex items-center gap-3">
            <Link to="/app/experiences" className="flex items-center">
              <motion.img
                src={bravoLogo}
                alt="Bravo!"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="h-6 md:h-7 w-auto"
              />
            </Link>

            {companyLogo && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center"
              >
                <div className="w-px h-6 bg-border/50 mr-3" />
                <img
                  src={companyLogo}
                  alt={companyName || "Company logo"}
                  className="h-7 md:h-8 w-auto max-w-[100px] md:max-w-[120px] object-contain"
                />
              </motion.div>
            )}
          </div>

          {/* Desktop/Tablet navigation */}
          {!isMobile && (
            <nav className="flex items-center gap-1 lg:gap-2">
              <Link
                to="/app/experiences"
                className={`text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isActive("/app/experiences")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">Esplora</span>
              </Link>

              <Link
                to="/app/bookings"
                className={`text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isActive("/app/bookings")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden lg:inline">Prenotazioni</span>
              </Link>

              <Link
                to="/app/impact"
                className={`text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isActive("/app/impact")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Sprout className="h-4 w-4" />
                <span className="hidden lg:inline">Impatto</span>
              </Link>

              <Link
                to="/app/profile"
                className={`text-sm font-medium transition-colors flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isActive("/app/profile")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {(profile?.first_name?.[0] || "") + (profile?.last_name?.[0] || "") || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">Profilo</span>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 md:py-8 pb-24 md:pb-8">{children}</main>

      {/* Bottom navigation - mobile only */}
      {isMobile && <BottomNavigation />}
    </div>
  );
}
