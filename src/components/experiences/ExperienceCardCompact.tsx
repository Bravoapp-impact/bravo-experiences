import { Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { BravoCard, BravoCardMetaItem } from "@/components/common/BravoCard";
import { CardAssociationLine } from "@/components/common/CardAssociationLine";
import { format, differenceInMinutes } from "date-fns";
import { it } from "date-fns/locale";
import type { Experience } from "@/types/experiences";

interface ExperienceCardCompactProps {
  experience: Experience;
  index: number;
  className?: string;
  /** Base path for navigation (defaults to /app/experiences). */
  linkPrefix?: string;
}

export function ExperienceCardCompact({
  experience,
  index,
  className,
  linkPrefix = "/app/experiences",
}: ExperienceCardCompactProps) {
  const navigate = useNavigate();
  const nextDate = experience.experience_dates?.[0];
  const availableSpots = nextDate
    ? nextDate.max_participants - (nextDate.confirmed_count || 0)
    : 0;

  const duration = nextDate
    ? Math.round(
        differenceInMinutes(new Date(nextDate.end_datetime), new Date(nextDate.start_datetime)) / 60,
      )
    : null;

  const isFull = availableSpots <= 0;

  // Build meta row: data · durata · posti (posti omitted when full)
  const metaItems: BravoCardMetaItem[] = [];
  if (nextDate) {
    metaItems.push({
      text: format(new Date(nextDate.start_datetime), "EEE d MMM", { locale: it }),
    });
    if (duration) {
      metaItems.push({ icon: Clock, text: `${duration}h` });
    }
    if (!isFull) {
      metaItems.push({
        icon: Users,
        text: String(availableSpots),
        className: availableSpots <= 3 ? "text-destructive font-normal" : undefined,
      });
    }
  }

  const imageOverlay = isFull ? (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-destructive/90 text-destructive-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
      Completo
    </div>
  ) : null;

  return (
    <BravoCard
      className={className ?? "w-[145px] sm:w-[165px] md:w-[200px] flex-shrink-0"}
      imageUrl={experience.image_url}
      imageAlt={experience.title}
      aspectRatio="square"
      imageOverlay={imageOverlay}
      title={experience.title}
      subtitleSlot={
        experience.association_name ? (
          <CardAssociationLine
            name={experience.association_name}
            logoUrl={experience.association_logo_url}
          />
        ) : undefined
      }
      metaItems={metaItems}
      onOpen={() => navigate(`${linkPrefix}/${experience.id}`)}
      dimmed={isFull}
      index={index}
    />
  );
}
