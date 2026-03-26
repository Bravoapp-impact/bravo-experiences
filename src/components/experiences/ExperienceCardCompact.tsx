import { motion } from "framer-motion";
import { Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { format, differenceInMinutes } from "date-fns";
import { it } from "date-fns/locale";
import type { Experience, ExperienceDate } from "@/types/experiences";

interface ExperienceCardCompactProps {
  experience: Experience;
  index: number;
}

export function ExperienceCardCompact({ experience, index }: ExperienceCardCompactProps) {
  const navigate = useNavigate();
  const nextDate = experience.experience_dates?.[0];
  const availableSpots = nextDate
    ? nextDate.max_participants - (nextDate.confirmed_count || 0)
    : 0;

  // Calculate duration in hours
  const duration = nextDate
    ? Math.round(differenceInMinutes(new Date(nextDate.end_datetime), new Date(nextDate.start_datetime)) / 60)
    : null;

  const isFull = availableSpots <= 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      onClick={() => onSelect(experience)}
      className={`group flex-shrink-0 w-[145px] sm:w-[165px] md:w-[200px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl ${isFull ? "opacity-60" : ""}`}
    >
      {/* Square Image with category badge + "Completo" overlay */}
      <div className="relative">
        <BaseCardImage
          imageUrl={experience.image_url}
          alt={experience.title}
          aspectRatio="square"
          badge={
            experience.category ? (
            <Badge
                variant="secondary"
                className="text-[10px] font-medium bg-white/95 text-foreground backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm"
              >
                {experience.category}
              </Badge>
            ) : null
          }
          badgePosition="top-left"
        />
        {/* "Completo" overlay badge */}
        {isFull && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-destructive/90 text-destructive-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
            Completo
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-2 space-y-1">
        {/* Title - regular weight, more natural */}
        <h3 className="text-[13px] font-medium text-foreground line-clamp-2 leading-snug transition-colors">
          {experience.title}
        </h3>

        {/* Association with logo */}
        {experience.association_name && (
          <div className="flex items-center gap-1">
            {experience.association_logo_url ? (
              <img
                src={experience.association_logo_url}
                alt=""
                className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-[7px]">🏢</span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground font-light truncate">
              {experience.association_name}
            </p>
          </div>
        )}

        {/* Date + Duration + Spots - lighter text */}
        {nextDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
            <span>
              {format(new Date(nextDate.start_datetime), "EEE d MMM", { locale: it })}
            </span>
            {duration && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {duration}h
                </span>
              </>
            )}
            {!isFull && (
              <>
                <span className="text-border">·</span>
                <span className={`flex items-center gap-0.5 ${availableSpots <= 3 ? "text-destructive font-normal" : ""}`}>
                  <Users className="h-2.5 w-2.5" />
                  {availableSpots}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}
