import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AssociationProfileProps {
  id: string | null;
  name: string;
  logoUrl: string | null;
  description: string | null;
}

export function AssociationProfile({ id, name, logoUrl, description }: AssociationProfileProps) {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-xl font-semibold text-foreground mb-6">Organizzato da</h2>
      <div className="flex items-start gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🏢</span>
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {description}
            </p>
          )}
          {id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/associations/${id}`)}
              className="mt-2 rounded-xl"
            >
              Scopri di più su {name}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
