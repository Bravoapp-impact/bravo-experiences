import { motion } from "framer-motion";
import { Star, ChevronRight, Camera } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getPositiveTagLabel } from "@/lib/feedback-tags";

export interface CompletedExperienceBooking {
  id: string;
  status: string;
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
      city?: string | null;
    };
  };
}

export interface CompletedExperienceReview {
  rating: number;
  feedback_positive_tags: string[];
}

interface CompletedExperienceCardProps {
  booking: CompletedExperienceBooking;
  review?: CompletedExperienceReview | null;
  index?: number;
  onOpen: (booking: CompletedExperienceBooking) => void;
  onLeaveFeedback: (booking: CompletedExperienceBooking) => void;
}

export function CompletedExperienceCard({
  booking,
  review,
  index = 0,
  onOpen,
  onLeaveFeedback,
}: CompletedExperienceCardProps) {
  const exp = booking.experience_dates.experiences;
  const startDate = new Date(booking.experience_dates.start_datetime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={() => onOpen(booking)}
      className="group flex flex-col rounded-2xl bg-card border border-border/50 overflow-hidden cursor-pointer hover:border-border transition-colors"
    >
      <div className="flex items-stretch gap-3 p-3">
        {/* Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
          {exp.image_url ? (
            <img
              src={exp.image_url}
              alt={exp.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl">🤝</span>
            </div>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {exp.title}
          </h3>
          {exp.association_name && (
            <p className="text-[12px] text-muted-foreground truncate mt-0.5">
              {exp.association_name}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            {format(startDate, "d MMMM yyyy", { locale: it })}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground self-center flex-shrink-0" />
      </div>

      {/* Review state */}
      <div className="px-3 pb-3 pt-0">
        {!review ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLeaveFeedback(booking);
            }}
            className="w-full text-[12px] font-medium px-3 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            Lascia un feedback
          </button>
        ) : (
          <div
            className="flex flex-col gap-2 rounded-lg bg-muted/40 px-3 py-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-3.5 w-3.5",
                    s <= review.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            {/* Chips */}
            {review.feedback_positive_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {review.feedback_positive_tags.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-background border border-border/60 text-foreground/80"
                  >
                    {getPositiveTagLabel(slug)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
