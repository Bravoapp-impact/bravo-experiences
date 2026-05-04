import { ReactNode } from "react";
import { Clock, MapPin, Users } from "lucide-react";

const LOCATION_LABELS: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Indoor / Outdoor",
};

interface TBFormatHeaderProps {
  title: string;
  categoryName: string | null;
  shortDescription?: string | null;
  description?: string | null;
  locationType?: string | null;
  durationHours: number | null;
  participantsMin: number | null;
  participantsMax: number | null;
  headerExtras?: ReactNode;
}

export function TBFormatHeader({
  title,
  categoryName,
  shortDescription: shortDescProp,
  description,
  locationType,
  durationHours,
  participantsMin,
  participantsMax,
  headerExtras,
}: TBFormatHeaderProps) {
  const displayDesc = shortDescProp || (description
    ? description.length > 180
      ? description.slice(0, 180).trimEnd() + "…"
      : description
    : null);

  const showParticipants = participantsMin || participantsMax;

  return (
    <div className="space-y-3 lg:flex lg:flex-col lg:justify-center">
      {headerExtras}

      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-tight">
        {title}
      </h1>

      {displayDesc && (
        <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
          {displayDesc}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {categoryName && <span>{categoryName}</span>}
        {showParticipants && (
          <>
            {categoryName && <span>·</span>}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {participantsMin ?? "—"}–{participantsMax ?? "—"} persone
            </span>
          </>
        )}
        {durationHours && durationHours > 0 && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {durationHours}h
            </span>
          </>
        )}
        {locationType && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {LOCATION_LABELS[locationType] ?? locationType}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
