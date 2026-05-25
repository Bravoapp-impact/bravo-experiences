import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  CompletedExperienceCard,
  CompletedExperienceBooking,
  CompletedExperienceReview,
} from "@/components/experiences/CompletedExperienceCard";
import { BookingDetailModal } from "@/components/bookings/BookingDetailModal";
import { FeedbackModal } from "@/components/bookings/FeedbackModal";
import { PhotoUploadDialog } from "@/components/gallery/PhotoUploadDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isPast } from "date-fns";

export default function CompletedExperiences() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<CompletedExperienceBooking[]>([]);
  const [reviews, setReviews] = useState<Map<string, CompletedExperienceReview>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] =
    useState<CompletedExperienceBooking | null>(null);
  const [feedbackBooking, setFeedbackBooking] =
    useState<CompletedExperienceBooking | null>(null);
  const [uploadDialogBooking, setUploadDialogBooking] =
    useState<CompletedExperienceBooking | null>(null);

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          created_at,
          experience_dates (
            id,
            start_datetime,
            end_datetime,
            experiences (
              id,
              title,
              description,
              image_url,
              association_name,
              association_id,
              city,
              address,
              category,
              participant_info
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error || !data) {
        setBookings([]);
        return;
      }

      const valid = data.filter(
        (b: any) => b.experience_dates && b.experience_dates.experiences
      );

      // Hydrate association from public view (same pattern as MyBookings)
      const assocIds = Array.from(
        new Set(
          valid
            .map((b: any) => b.experience_dates.experiences.association_id)
            .filter((id: string | null): id is string => !!id)
        )
      );
      const assocMap = new Map<string, { name: string; logo_url: string | null }>();
      if (assocIds.length > 0) {
        const { data: assocs } = await supabase
          .from("associations_public" as any)
          .select("id, name, logo_url")
          .in("id", assocIds)
          .returns<{ id: string; name: string; logo_url: string | null }[]>();
        (assocs || []).forEach((a) =>
          assocMap.set(a.id, { name: a.name, logo_url: a.logo_url })
        );
      }

      const hydrated = valid.map((b: any) => {
        const exp = b.experience_dates.experiences;
        const fromView = exp.association_id ? assocMap.get(exp.association_id) : undefined;
        return {
          ...b,
          experience_dates: {
            ...b.experience_dates,
            experiences: {
              ...exp,
              association_name: fromView?.name || exp.association_name,
              association_logo_url: fromView?.logo_url || null,
            },
          },
        };
      });

      // "Completate" = status 'completed' OR (status 'confirmed' AND past date)
      // Exclude cancelled / no_show
      const completed = hydrated
        .filter((b: any) => {
          if (b.status === "cancelled" || b.status === "no_show") return false;
          if (b.status === "completed") return true;
          if (b.status === "confirmed") {
            return isPast(new Date(b.experience_dates.start_datetime));
          }
          return false;
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.experience_dates.start_datetime).getTime() -
            new Date(a.experience_dates.start_datetime).getTime()
        );

      setBookings(completed as CompletedExperienceBooking[]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("experience_reviews" as any)
      .select("booking_id, rating, feedback_positive_tags")
      .returns<
        { booking_id: string; rating: number; feedback_positive_tags: string[] }[]
      >();

    const map = new Map<string, CompletedExperienceReview>();
    (data || []).forEach((r) => {
      map.set(r.booking_id, {
        rating: r.rating,
        feedback_positive_tags: r.feedback_positive_tags || [],
      });
    });
    setReviews(map);
  };

  useEffect(() => {
    fetchBookings();
    fetchReviews();
  }, [user]);

  const handleFeedbackSubmitted = () => {
    setFeedbackBooking(null);
    fetchReviews();
  };

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/app/profile"
          aria-label="Indietro"
          className="flex items-center justify-center h-10 w-10 rounded-full bg-muted hover:bg-muted/70 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-6">
        Esperienze completate
      </h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/30 p-3"
            >
              <Skeleton className="h-20 w-20 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Nessuna esperienza ancora"
          description="Quando avrai partecipato alla tua prima esperienza di volontariato, la troverai qui."
          action={
            <Link
              to="/app/experiences"
              className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Esplora le esperienze
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {bookings.map((b, i) => (
            <CompletedExperienceCard
              key={b.id}
              booking={b}
              review={reviews.get(b.id)}
              index={i}
              onOpen={setSelectedBooking}
              onLeaveFeedback={setFeedbackBooking}
              onUploadPhotos={setUploadDialogBooking}
            />
          ))}
        </div>
      )}

      <BookingDetailModal
        booking={selectedBooking as any}
        onClose={() => setSelectedBooking(null)}
        onCancel={() => {}}
        isCancelling={false}
        onUploadPhotos={(b) => {
          setSelectedBooking(null);
          setUploadDialogBooking(b as any);
        }}
      />

      <FeedbackModal
        open={!!feedbackBooking}
        onClose={() => setFeedbackBooking(null)}
        onSubmitted={handleFeedbackSubmitted}
        booking={feedbackBooking as any}
      />

      {uploadDialogBooking && (
        <PhotoUploadDialog
          open={!!uploadDialogBooking}
          onOpenChange={(o) => !o && setUploadDialogBooking(null)}
          experienceDateId={uploadDialogBooking.experience_dates.id}
          experienceTitle={uploadDialogBooking.experience_dates.experiences.title}
          eventDate={uploadDialogBooking.experience_dates.start_datetime}
        />
      )}
    </AppLayout>
  );
}
