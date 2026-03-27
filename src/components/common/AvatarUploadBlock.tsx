import { useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadBlockProps {
  imageUrl?: string | null;
  fallbackInitials: string;
  title: string;
  description?: string;
  onUpload?: (file: File) => void;
  uploading?: boolean;
  disabled?: boolean;
}

export default function AvatarUploadBlock({
  imageUrl,
  fallbackInitials,
  title,
  description = "Supportiamo PNG e JPEG sotto 2MB",
  onUpload,
  uploading = false,
  disabled = false,
}: AvatarUploadBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file && onUpload) onUpload(file);
  };

  return (
    <div className="flex items-center gap-4 mb-8">
      <Avatar className="h-16 w-16">
        <AvatarImage src={imageUrl || undefined} alt={title} />
        <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
          {fallbackInitials}
        </AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-1 h-7 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading || !onUpload}
        >
          {uploading ? (
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-3 w-3" />
          )}
          {uploading ? "Caricamento..." : "Carica immagine"}
        </Button>
        {onUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
        )}
      </div>
    </div>
  );
}
