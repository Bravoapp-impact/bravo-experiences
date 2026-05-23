import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BaseModal } from "@/components/common/BaseModal";
import { cn } from "@/lib/utils";
import { POSITIVE_TAGS, MAX_POSITIVE_TAGS as MAX_TAGS } from "@/lib/feedback-tags";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  booking: {
    id: string;
    experience_dates: {
      start_datetime: string;
      experiences: {
        title: string;
      };
    };
  } | null;
}

export function FeedbackModal({ open, onClose, onSubmitted, booking }: FeedbackModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackPositive, setFeedbackPositive] = useState("");
  const [feedbackImprovement, setFeedbackImprovement] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setWouldRecommend(null);
    setSelectedTags([]);
    setFeedbackPositive("");
    setFeedbackImprovement("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, slug];
    });
  };

  const handleSubmit = async () => {
    if (!booking || rating === 0 || wouldRecommend === null) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("experience_reviews" as any)
        .insert({
          booking_id: booking.id,
          rating,
          would_recommend: wouldRecommend,
          feedback_positive_tags: selectedTags,
          feedback_positive: feedbackPositive.trim() || null,
          feedback_improvement: feedbackImprovement.trim() || null,
        } as any);

      if (error) throw error;

      toast({
        title: "Grazie per il tuo feedback! 💜",
        description: "Il tuo contributo ci aiuta a migliorare le esperienze.",
      });

      resetForm();
      onSubmitted();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Non è stato possibile inviare il feedback. Riprova.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = rating > 0 && wouldRecommend !== null;
  const tagsLimitReached = selectedTags.length >= MAX_TAGS;

  if (!booking) return null;

  const subtitle = `${booking.experience_dates.experiences.title} · ${format(
    new Date(booking.experience_dates.start_datetime),
    "d MMMM yyyy",
    { locale: it }
  )}`;

  return (
    <BaseModal
      open={open}
      onClose={handleClose}
      title="Com'è andata?"
      subtitle={subtitle}
    >
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Star Rating */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Valuta l'esperienza
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform active:scale-90"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Would Recommend */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Consiglieresti questa esperienza a qualcun altro?
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                wouldRecommend === true
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              Sì 👍
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                wouldRecommend === false
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              No 👎
            </button>
          </div>
        </div>

        {/* Positive Tags */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              L'esperienza è stata bella perché…{" "}
              <span className="text-muted-foreground font-normal">(opzionale)</span>
            </label>
            <span className="text-xs text-muted-foreground">
              {selectedTags.length}/{MAX_TAGS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {POSITIVE_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.slug);
              const isDisabled = !isSelected && tagsLimitReached;
              return (
                <button
                  key={tag.slug}
                  type="button"
                  onClick={() => toggleTag(tag.slug)}
                  disabled={isDisabled}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm border transition-all",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-foreground hover:border-primary/50",
                    isDisabled && "opacity-40 cursor-not-allowed hover:border-border"
                  )}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional free-text addition */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Vuoi aggiungere altro?{" "}
            <span className="text-muted-foreground font-normal">(opzionale)</span>
          </label>
          <Textarea
            value={feedbackPositive}
            onChange={(e) => setFeedbackPositive(e.target.value)}
            placeholder="Racconta qualcosa in più sull'esperienza..."
            className="resize-none rounded-xl"
            rows={3}
            maxLength={1000}
          />
        </div>

        {/* Improvement Feedback */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Cosa poteva andare meglio?{" "}
            <span className="text-muted-foreground font-normal">(opzionale)</span>
          </label>
          <Textarea
            value={feedbackImprovement}
            onChange={(e) => setFeedbackImprovement(e.target.value)}
            placeholder="Aiutaci a migliorare..."
            className="resize-none rounded-xl"
            rows={3}
            maxLength={1000}
          />
        </div>
      </div>

      {/* Fixed footer with submit button */}
      <div className="flex-shrink-0 p-5 border-t border-border bg-background">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full h-12 rounded-xl text-base font-medium"
        >
          {submitting ? "Invio in corso..." : "Invia feedback"}
        </Button>
      </div>
    </BaseModal>
  );
}
