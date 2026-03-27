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

      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={companyLogoUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-base font-medium">
            {getInitials(companyName)}
          </AvatarFallback>
        </Avatar>
        <Button variant="outline" size="sm" disabled>
          <Upload className="mr-2 h-3.5 w-3.5" />
          Carica logo
        </Button>
      </div>

      <div className="mb-3 max-w-sm">
        <Label className="text-xs text-muted-foreground">Nome azienda</Label>
        <Input value={companyName} readOnly className="mt-1 bg-muted/30" />
      </div>

      <p className="text-xs text-muted-foreground">Per modificare i dati contatta il tuo referente Bravo!</p>
    </motion.div>
  );
}
