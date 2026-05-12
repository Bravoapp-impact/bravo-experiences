import { motion } from "framer-motion";
import { MapPin, Users, Calendar, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BaseCardImage } from "@/components/common/BaseCardImage";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Experience, ExperienceDate } from "@/types/experiences";

interface ExperienceCardRichProps {
  experience: Experience;
  index: number;
}

export function ExperienceCardRich({ experience, index }: ExperienceCardRichProps) {
  const navigate = useNavigate();
  const nextDate = experience.experience_dates?.[0];
  const availableSpots = nextDate
    ? nextDate.max_participants - (nextDate.confirmed_count || 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border transition-all duration-300 hover:shadow-md"
    >
      {/* Image */}
      <BaseCardImage
        imageUrl={experience.image_url}
        alt={experience.title}
        aspectRatio="video"
        fallbackEmoji="🤝"
        badge={
          experience.category ? (
            <Badge
              variant="secondary"
              className="bg-background/90 backdrop-blur-sm"
            >
              {experience.category}
            </Badge>
          ) : null
        }
        badgePosition="top-left"
        className="rounded-none"
      />

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Association */}
        {experience.association_name && (
          <p className="text-[11px] font-medium text-muted-foreground">
            {experience.association_name}
          </p>
        )}

        {/* Title */}
        <h3 className="text-base font-semibold text-foreground line-clamp-2">
          {experience.title}
        </h3>

        {/* Description */}
        {experience.description && (
          <p className="text-[13px] text-muted-foreground line-clamp-2">
            {experience.description}
          </p>
        )}

        {/* Location */}
        {experience.city && (
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary/70" />
            <span>{experience.city}</span>
          </div>
        )}

        {/* Next date info */}
        {nextDate && (
          <div className="pt-4 border-t border-border/50 space-y-2">
          <div className="flex items-center gap-2 text-[13px]">
              <Calendar className="h-4 w-4 text-primary/70" />
              <span className="font-medium">
                {format(new Date(nextDate.start_datetime), "EEEE d MMMM", { locale: it })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(nextDate.start_datetime), "HH:mm")} -{" "}
                  {format(new Date(nextDate.end_datetime), "HH:mm")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Users className="h-4 w-4 text-primary/70" />
                <span className={availableSpots <= 3 ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {availableSpots} posti
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          onClick={() => navigate(`/app/experiences/${experience.id}`)}
          className="w-full mt-4 group/btn"
        >
          Scopri e prenota
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </div>
    </motion.div>
  );
}
