interface CardAssociationLineProps {
  name: string;
  logoUrl?: string | null;
  fallbackEmoji?: string;
}

/**
 * Riga "logo cerchiato + nome associazione" usata sotto al titolo
 * nelle card di listing compatte (BravoCard subtitleSlot).
 */
export function CardAssociationLine({
  name,
  logoUrl,
  fallbackEmoji = "🏢",
}: CardAssociationLineProps) {
  return (
    <div className="flex items-center gap-1">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-[7px]">{fallbackEmoji}</span>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground font-light truncate">
        {name}
      </p>
    </div>
  );
}
