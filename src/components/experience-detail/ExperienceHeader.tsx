import { Clock, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const LOCATION_LABELS: Record<string, string> = {
  indoor: "Indoor",
  outdoor: "Outdoor",
  both: "Indoor / Outdoor",
};

interface ExperienceHeaderProps {
  title: string;
  categoryName: string | null;
  cityName: string | null;
  defaultHours: number | null;
  avgRating: number | null;
  reviewCount: number;
  description?: string | null;
  locationType?: string | null;
}

export function ExperienceHeader({
  title,
  categoryName,
  cityName,
  defaultHours,
  avgRating,
  reviewCount,
  description,
  locationType,
}: ExperienceHeaderProps) {
  const metaItems: string[] = [];
  if (categoryName) metaItems.push(categoryName);
  if (cityName) metaItems.push(cityName);

  // Truncate description to ~2-3 lines
  const shortDescription = description
    ? description.length > 180
      ? description.slice(0, 180).trimEnd() + "…"
      : description
    : null;

  return (
    <div className="space-y-3 lg:flex lg:flex-col lg:justify-center">
      <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-tight">
        {title}
      </h1>

      {shortDescription && (
        <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
          {shortDescription}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
        {avgRating !== null && reviewCount > 0 && (
          <>
            <span className="flex items-center gap-1 text-foreground font-medium">
              <Star className="h-3.5 w-3.5 fill-current" />
              {avgRating.toFixed(2)}
            </span>
            <span>·</span>
            <span>{reviewCount} recensioni</span>
            {metaItems.length > 0 && <span>·</span>}
          </>
        )}
        {metaItems.map((item, i) => (
          <span key={i}>
            {i > 0 && <span className="mr-2">·</span>}
            {item}
          </span>
        ))}
        {defaultHours && defaultHours > 0 && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {defaultHours}h
            </span>
          </>
        )}
      </div>
    </div>
  );
}
