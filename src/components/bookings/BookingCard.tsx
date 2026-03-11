import { motion } from "framer-motion";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { it } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { BaseCardImage } from "@/components/common/BaseCardImage";

interface BookingCardProps {
  booking: {
    id: string;
    status: string;
    created_at: string;
    experience_dates: {
      id: string;
      start_datetime: string;
      end_datetime: string;
      experiences: {
        id: string;
        title: string;
        image_url: string | null;
        association_name: string | null;
        association_logo_url?: string | null;
        city: string | null;
        address: string | null;
        category: string | null;
      };
    };
  };
  index: number;
  isPast?: boolean;
  hasReview?: boolean;
  onCancel: (bookingId: string) => void;
  onView: (booking: any) => void;
  onFeedback?: (booking: any) => void;
  isCancelling?: boolean;
}

export function BookingCard({
  booking,
  index,
  isPast = false,
  hasReview = false,
  onView,
  onFeedback,
}: BookingCardProps) {
  const experience = booking.experience_dates.experiences;
  const startDate = new Date(booking.experience_dates.start_datetime);
  const endDate = new Date(booking.experience_dates.end_datetime);

  // Calculate duration
  const durationMinutes = differenceInMinutes(endDate, startDate);
  const durationHours = Math.round(durationMinutes / 60);

  // Past booking - compact horizontal layout
  if (isPast) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={() => onView(booking)}
        className="group flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {experience.image_url ? (
            <img
              src={experience.image_url}
              alt={experience.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-lg">🤝</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground truncate">
            {experience.title}
          </p>
          <p className="text-[11px] text-muted-foreground/70">
            {format(startDate, "d MMMM yyyy", { locale: it })}
          </p>
        </div>
        {booking.status === "cancelled" ? (
          <Badge variant="secondary" className="text-xs">
            Annullata
          </Badge>
        ) : booking.status === "no_show" ? (
          <Badge variant="secondary" className="text-xs">
            Assente
          </Badge>
        ) : !hasReview && onFeedback ? (
          <Badge
            className="text-xs cursor-pointer bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
            onClick={(e) => {
              e.stopPropagation();
              onFeedback(booking);
            }}
          >
            Lascia feedback
          </Badge>
        ) : null}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </motion.div>
    );
  }

  // Future booking - Airbnb-style card
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={() => onView(booking)}
      className="group w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl"
    >
      {/* Square Image with date badge */}
      <BaseCardImage
        imageUrl={experience.image_url}
        alt={experience.title}
        aspectRatio="square"
        badge={
          <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase leading-none">
              {format(startDate, "MMM", { locale: it })}
            </p>
            <p className="text-xl font-bold text-foreground leading-none mt-0.5">
              {format(startDate, "d")}
            </p>
          </div>
        }
        badgePosition="top-left"
      />

      {/* Content */}
      <div className="pt-2 space-y-1">
        {/* Title */}
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

        {/* Time + Duration + Location */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-light">
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {format(startDate, "HH:mm")}
          </span>
          {durationHours > 0 && (
            <>
              <span className="text-border">·</span>
              <span>{durationHours}h</span>
            </>
          )}
          {experience.city && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                <span className="truncate">{experience.city}</span>
              </span>
            </>
          )}
        </div>

        {/* Status badge if cancelled */}
        {booking.status === "cancelled" && (
          <Badge variant="destructive" className="mt-2">
            Annullata
          </Badge>
        )}
      </div>
    </motion.button>
  );
}
