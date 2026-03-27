import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function SettingsGeneral() {
  const { profile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.company_id) return;
    supabase
      .from("companies")
      .select("name, logo_url")
      .eq("id", profile.company_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setCompanyName(data.name);
          setCompanyLogoUrl(data.logo_url);
        }
      });
  }, [profile?.company_id]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <h2 className="text-lg font-semibold text-foreground">Profilo azienda</h2>
      <p className="text-sm text-muted-foreground mb-6">Informazioni sulla tua azienda su Bravo!</p>

      {/* Logo — Attio style */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={companyLogoUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
            {getInitials(companyName)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Logo azienda</p>
          <p className="text-xs text-muted-foreground">Supportiamo PNG e JPEG sotto 2MB</p>
          <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" disabled>
            <Upload className="mr-1.5 h-3 w-3" />
            Carica logo
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nome azienda</Label>
          <Input value={companyName} readOnly className="bg-muted/30" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">Per modificare i dati contatta il tuo referente Bravo!</p>
    </motion.div>
  );
}
