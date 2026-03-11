import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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
  const [feedbackPositive, setFeedbackPositive] = useState("");
  const [feedbackImprovement, setFeedbackImprovement] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setWouldRecommend(null);
    setFeedbackPositive("");
    setFeedbackImprovement("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
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

  return (
    <AnimatePresence>
      {open && booking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full h-full md:h-auto md:max-w-md bg-background md:rounded-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-background z-10 px-6 pt-5 pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Com'è andata?
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-[13px] text-muted-foreground mt-1">
                {booking.experience_dates.experiences.title} ·{" "}
                {format(new Date(booking.experience_dates.start_datetime), "d MMMM yyyy", { locale: it })}
              </p>
            </div>

            <div className="px-6 py-5 space-y-6">
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

              {/* Positive Feedback */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Cosa ti è piaciuto? <span className="text-muted-foreground font-normal">(opzionale)</span>
                </label>
                <Textarea
                  value={feedbackPositive}
                  onChange={(e) => setFeedbackPositive(e.target.value)}
                  placeholder="Racconta cosa ti ha colpito di più..."
                  className="resize-none rounded-xl"
                  rows={3}
                  maxLength={1000}
                />
              </div>

              {/* Improvement Feedback */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Cosa poteva andare meglio? <span className="text-muted-foreground font-normal">(opzionale)</span>
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

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!isValid || submitting}
                className="w-full h-12 rounded-xl text-base font-medium"
              >
                {submitting ? "Invio in corso..." : "Invia feedback"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
