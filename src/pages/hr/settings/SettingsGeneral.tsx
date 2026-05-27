import { useEffect, useState } from "react";
import { Save, Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SettingsPage from "@/components/common/SettingsPage";
import AvatarUploadBlock from "@/components/common/AvatarUploadBlock";

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function SettingsGeneral() {
  const { profile } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const companyId = profile?.company_id;

  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("companies")
      .select("name, logo_url")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setCompanyName(data.name);
          setOriginalName(data.name);
          setCompanyLogoUrl(data.logo_url);
        }
      });
  }, [companyId]);

  const hasChanges = companyName !== originalName;

  const handleSave = async () => {
    if (!companyId || !companyName.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ name: companyName.trim() })
        .eq("id", companyId);
      if (error) throw error;
      setOriginalName(companyName.trim());
      toast.success("Profilo azienda aggiornato!");
    } catch {
      toast.error("Errore durante l'aggiornamento");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!companyId) return;
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp|svg\+xml)$/)) {
      toast.error("Formato non supportato.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Immagine troppo grande. Massimo 2MB.");
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const filePath = `${companyId}/logo.${fileExt}`;

      await supabase.storage.from("company-logos").remove([
        `${companyId}/logo.png`, `${companyId}/logo.jpg`, `${companyId}/logo.jpeg`,
        `${companyId}/logo.webp`, `${companyId}/logo.svg`,
      ]);

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("company-logos").getPublicUrl(filePath);
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: logoUrl })
        .eq("id", companyId);
      if (updateError) throw updateError;

      setCompanyLogoUrl(logoUrl);
      toast.success("Logo aggiornato!");
    } catch {
      toast.error("Errore durante il caricamento del logo");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!companyId) return;
    setUploading(true);
    try {
      await supabase.storage.from("company-logos").remove([
        `${companyId}/logo.png`, `${companyId}/logo.jpg`, `${companyId}/logo.jpeg`,
        `${companyId}/logo.webp`, `${companyId}/logo.svg`,
      ]);
      const { error } = await supabase
        .from("companies")
        .update({ logo_url: null })
        .eq("id", companyId);
      if (error) throw error;
      setCompanyLogoUrl(null);
      toast.success("Logo rimosso!");
    } catch {
      toast.error("Errore durante la rimozione del logo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SettingsPage title="Profilo azienda" icon={Building2} iconColor="text-blue-500">
      <AvatarUploadBlock
        imageUrl={companyLogoUrl}
        fallbackInitials={getInitials(companyName)}
        title="Logo azienda"
        onUpload={handleLogoUpload}
        onRemove={handleLogoRemove}
        uploading={uploading}
      />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nome azienda</Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Salvataggio...</> : <><Save className="mr-2 h-3.5 w-3.5" />Salva modifiche</>}
            </Button>
          </div>
        )}
      </div>
    </SettingsPage>
  );
}