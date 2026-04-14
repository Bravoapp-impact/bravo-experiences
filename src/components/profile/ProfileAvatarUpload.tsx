import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { devLog } from "@/lib/logger";

interface ProfileAvatarUploadProps {
  userId: string;
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  onUploadComplete: () => Promise<void>;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};

const fallbackTextClasses = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

export function ProfileAvatarUpload({
  userId,
  avatarUrl,
  firstName,
  lastName,
  onUploadComplete,
  size = "md",
}: ProfileAvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const getInitials = () => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Reset input value to allow re-uploading the same file
    event.target.value = "";

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      toast.error("Formato non supportato. Usa PNG o JPG.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Immagine troppo grande. Massimo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Delete old avatar if exists (try common extensions)
      await supabase.storage
        .from("profile-avatars")
        .remove([
          `${userId}/avatar.png`,
          `${userId}/avatar.jpg`,
          `${userId}/avatar.jpeg`,
        ]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("profile-avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL (with cache buster)
      const avatarUrlWithCache = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrlWithCache })
        .eq("id", userId);

      if (updateError) throw updateError;

      await onUploadComplete();
      toast.success("Immagine profilo aggiornata!");
    } catch (error) {
      devLog.error("Error uploading avatar:", error);
      toast.error("Errore durante il caricamento dell'immagine");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userId || !avatarUrl) return;

    setUploading(true);
    try {
      // Delete avatar files from storage
      await supabase.storage
        .from("profile-avatars")
        .remove([
          `${userId}/avatar.png`,
          `${userId}/avatar.jpg`,
          `${userId}/avatar.jpeg`,
        ]);

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (updateError) throw updateError;

      await onUploadComplete();
      toast.success("Immagine profilo rimossa!");
    } catch (error) {
      devLog.error("Error removing avatar:", error);
      toast.error("Errore durante la rimozione dell'immagine");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={avatarUrl || undefined} alt="Avatar" />
          <AvatarFallback
            className={`bg-primary/10 text-primary font-medium ${fallbackTextClasses[size]}`}
          >
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Cambia immagine profilo"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleAvatarUpload}
          className="hidden"
        />
      </div>
      {avatarUrl && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemoveAvatar}
          disabled={uploading}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          aria-label="Rimuovi immagine profilo"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
