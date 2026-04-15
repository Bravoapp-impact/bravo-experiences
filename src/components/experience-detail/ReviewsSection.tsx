import { useState } from "react";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { ExperienceReview } from "@/types/experiences";

interface ReviewsSectionProps {
  reviews: ExperienceReview[];
  avgRating: number;
  totalCount: number;
}

export function ReviewsSection({ reviews, avgRating, totalCount }: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? reviews : reviews.slice(0, 6);

  return (
    <section>
      <Separator className="mb-8" />
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Star className="h-5 w-5 fill-current" />
        {avgRating.toFixed(2)} · {totalCount} recensioni
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayed.map((review) => (
          <div key={review.id} className="space-y-2">
            {/* Reviewer */}
            <div className="flex items-center gap-3">
              {review.reviewer_avatar ? (
                <img
                  src={review.reviewer_avatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {(review.reviewer_name || "?")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {review.reviewer_name || "Utente"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                    locale: it,
                  })}
                </p>
              </div>
            </div>
            {/* Stars */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < review.rating
                      ? "fill-foreground text-foreground"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            {/* Text */}
            {review.feedback_positive && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {review.feedback_positive}
              </p>
            )}
          </div>
        ))}
      </div>
      {!showAll && reviews.length > 6 && (
        <Button
          variant="outline"
          onClick={() => setShowAll(true)}
          className="mt-6 rounded-xl"
        >
          Mostra tutte le {totalCount} recensioni
        </Button>
      )}
    </section>
  );
}
