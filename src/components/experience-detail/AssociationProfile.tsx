interface AssociationProfileProps {
  id: string | null;
  name: string;
  logoUrl: string | null;
  description: string | null;
}

export function AssociationProfile({ name, logoUrl, description }: AssociationProfileProps) {
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
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
