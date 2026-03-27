import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SettingsPage from "@/components/common/SettingsPage";
import AvatarUploadBlock from "@/components/common/AvatarUploadBlock";

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
    <SettingsPage title="Profilo azienda" description="Informazioni sulla tua azienda su Bravo!">
      <AvatarUploadBlock
        imageUrl={companyLogoUrl}
        fallbackInitials={getInitials(companyName)}
        title="Logo azienda"
        disabled
      />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nome azienda</Label>
          <Input value={companyName} readOnly className="bg-muted/30" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">Per modificare i dati contatta il tuo referente Bravo!</p>
    </SettingsPage>
  );
}
