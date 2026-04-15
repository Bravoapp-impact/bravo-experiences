import { MapPin, Clock, Star } from "lucide-react";

interface ExperienceHeaderProps {
  title: string;
  categoryName: string | null;
  cityName: string | null;
  defaultHours: number | null;
  avgRating: number | null;
  reviewCount: number;
}

export function ExperienceHeader({
  title,
  categoryName,
  cityName,
  defaultHours,
  avgRating,
  reviewCount,
}: ExperienceHeaderProps) {
  const metaItems: string[] = [];
  if (categoryName) metaItems.push(categoryName);
  if (cityName) metaItems.push(cityName);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
        {title}
      </h1>
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
