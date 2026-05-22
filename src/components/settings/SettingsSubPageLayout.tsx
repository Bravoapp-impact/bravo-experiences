import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

interface SettingsSubPageLayoutProps {
  title: string;
  backTo?: string;
  children: ReactNode;
}

export function SettingsSubPageLayout({
  title,
  backTo = "/app/impostazioni",
  children,
}: SettingsSubPageLayoutProps) {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto pb-20 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to={backTo}
            aria-label="Indietro"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-muted hover:bg-muted/70 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-6">{title}</h1>
        <div>{children}</div>
      </div>
    </AppLayout>
  );
}
