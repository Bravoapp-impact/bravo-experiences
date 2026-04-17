import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useHourBudget } from "@/hooks/useHourBudget";
import { useIsMobile } from "@/hooks/use-mobile";
import { devLog } from "@/lib/logger";
import type { Experience, ExperienceDate, ExperienceReview } from "@/types/experiences";

// Sub-components
import { HeroImage } from "@/components/experience-detail/HeroImage";
import { ExperienceHeader } from "@/components/experience-detail/ExperienceHeader";
import { WhatYouWillDo } from "@/components/experience-detail/WhatYouWillDo";
import { ParticipantInfo } from "@/components/experience-detail/ParticipantInfo";
import { TagsSection } from "@/components/experience-detail/TagsSection";
import { ReviewsSection } from "@/components/experience-detail/ReviewsSection";
import { MeetingPlace } from "@/components/experience-detail/MeetingPlace";
import { SdgSection } from "@/components/experience-detail/SdgSection";
import { AssociationProfile } from "@/components/experience-detail/AssociationProfile";
import { RelatedExperiences } from "@/components/experience-detail/RelatedExperiences";
import { DatesSidebar } from "@/components/experience-detail/DatesSidebar";
import { MobileDateDrawer } from "@/components/experience-detail/MobileDateDrawer";

export default function ExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { remainingHours, isUnlimited, budgetHours, loading: budgetLoading } = useHourBudget();

  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Dates
  const [dates, setDates] = useState<ExperienceDate[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [userBookedDateIds, setUserBookedDateIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);

  // ─── Fetch experience ───
  useEffect(() => {
    if (!id) return;

    const fetchExperience = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("experiences")
          .select(`
            *,
            associations:association_id (
              id, name, logo_url, description, website
            ),
            categories:category_id (name),
            cities:city_id (name)
          `)
          .eq("id", id)
          .eq("status", "published")
          .single();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        const assoc = data.associations as any;
        const cat = data.categories as any;
        const city = data.cities as any;

        setExperience({
          id: data.id,
          title: data.title,
          description: data.description,
          image_url: data.image_url,
          association_name: assoc?.name ?? data.association_name,
          association_logo_url: assoc?.logo_url ?? null,
          association_id: assoc?.id ?? data.association_id,
          association_description: assoc?.description ?? null,
          association_website: assoc?.website ?? null,
          city: city?.name ?? data.city,
          city_name: city?.name ?? data.city,
          city_id: data.city_id,
          address: data.address,
          category: cat?.name ?? data.category,
          category_name: cat?.name ?? data.category,
          sdgs: data.sdgs ?? [],
          participant_info: data.participant_info ?? null,
          default_hours: data.default_hours,
          secondary_tags: data.secondary_tags ?? null,
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, [id]);

  // ─── Fetch dates ───
  useEffect(() => {
    if (!id) return;

    const fetchDates = async () => {
      setLoadingDates(true);
      try {
        const { data, error } = await supabase
          .from("experience_dates")
          .select("id, start_datetime, end_datetime, max_participants, volunteer_hours")
          .eq("experience_id", id)
          .gte("start_datetime", new Date().toISOString())
          .order("start_datetime", { ascending: true });

        if (error) throw error;

        const dateIds = (data || []).map((d) => d.id);
        const confirmedCountsMap = new Map<string, number>();
        const bookedByUser = new Set<string>();

        if (dateIds.length > 0) {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("experience_date_id, user_id")
            .in("experience_date_id", dateIds)
            .in("status", ["confirmed", "completed"]);

          (bookings || []).forEach((b) => {
            confirmedCountsMap.set(
              b.experience_date_id,
              (confirmedCountsMap.get(b.experience_date_id) || 0) + 1
            );
            if (b.user_id === user?.id) {
              bookedByUser.add(b.experience_date_id);
            }
          });
        }

        setUserBookedDateIds(bookedByUser);
        setDates(
          (data || []).map((d) => ({
            ...d,
            confirmed_count: confirmedCountsMap.get(d.id) || 0,
          }))
        );
      } catch (err) {
        devLog.error("Error fetching dates:", err);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchDates();
  }, [id, user?.id, showSuccess]);

  // ─── Fetch reviews ───
  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      // Get experience_date ids for this experience
      const { data: dateIds } = await supabase
        .from("experience_dates")
        .select("id")
        .eq("experience_id", id);

      if (!dateIds?.length) return;

      const edIds = dateIds.map((d) => d.id);

      // Get bookings for those dates
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, user_id, experience_date_id")
        .in("experience_date_id", edIds);

      if (!bookingsData?.length) return;

      const bookingIds = bookingsData.map((b) => b.id);
      const bookingUserMap = new Map(bookingsData.map((b) => [b.id, b.user_id]));

      // Get reviews
      const { data: reviewsData } = await supabase
        .from("experience_reviews")
        .select("id, rating, feedback_positive, feedback_improvement, would_recommend, created_at, booking_id")
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: false });

      if (!reviewsData?.length) return;

      // Get reviewer profiles
      const userIds = [...new Set(reviewsData.map((r) => bookingUserMap.get(r.booking_id)).filter(Boolean))] as string[];
      const profileMap = new Map<string, { first_name: string | null; last_name: string | null; avatar_url: string | null }>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url")
          .in("id", userIds);

        (profiles || []).forEach((p) => profileMap.set(p.id, p));
      }

      const mapped: ExperienceReview[] = reviewsData.map((r) => {
        const userId = bookingUserMap.get(r.booking_id);
        const profile = userId ? profileMap.get(userId) : undefined;
        return {
          id: r.id,
          rating: r.rating,
          feedback_positive: r.feedback_positive,
          feedback_improvement: r.feedback_improvement,
          would_recommend: r.would_recommend,
          created_at: r.created_at,
          reviewer_name: profile
            ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null
            : null,
          reviewer_avatar: profile?.avatar_url ?? null,
        };
      });

      setReviews(mapped);
      setReviewCount(mapped.length);
      if (mapped.length > 0) {
        const sum = mapped.reduce((acc, r) => acc + r.rating, 0);
        setAvgRating(sum / mapped.length);
      }
    };

    fetchReviews();
  }, [id]);

  // ─── Booking ───
  const handleBook = async () => {
    if (!selectedDateId || !user) return;

    setIsBooking(true);
    try {
      const { data: bookingData, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          experience_date_id: selectedDateId,
          status: "confirmed",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Sei già prenotato per questa data");
        }
        throw error;
      }

      if (bookingData) {
        supabase.functions.invoke("send-booking-confirmation", {
          body: { booking_id: bookingData.id },
        });
      }

      toast({
        title: "Prenotazione confermata! 🎉",
        description: "Ti aspettiamo per questa esperienza di volontariato.",
      });

      setSelectedDateId(null);
      setDrawerOpen(false);
      setShowSuccess(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore di prenotazione",
        description: error.message || "Non è stato possibile completare la prenotazione.",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const goBack = () => navigate("/app/experiences");

  // ─── Loading ───
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto px-4 lg:px-8 space-y-6 py-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="w-full aspect-[4/3] lg:aspect-[16/10] rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-8">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="hidden lg:block w-[380px]">
              <Skeleton className="h-[300px] rounded-2xl" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─── Not found ───
  if (notFound || !experience) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-lg font-semibold mb-2">Esperienza non trovata</h2>
          <p className="text-sm text-muted-foreground mb-6">
            L'esperienza che cerchi non esiste o non è disponibile.
          </p>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al catalogo
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ─── Success state ───
  if (showSuccess) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-xl font-bold mb-2">Prenotazione confermata!</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Ti aspettiamo per <strong>{experience.title}</strong>. Riceverai un'email di conferma.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/app/bookings")}>Le mie prenotazioni</Button>
              <Button variant="outline" onClick={goBack}>
                Torna al catalogo
              </Button>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  // Shared sidebar/drawer props
  const dateProps = {
    dates,
    loading: loadingDates,
    selectedDateId,
    onSelectDate: setSelectedDateId,
    onBook: handleBook,
    isBooking,
    userBookedDateIds,
    remainingHours,
    isUnlimited,
    budgetHours,
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {/* Back button */}
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al catalogo
        </button>

        {/* Split-screen hero: image left + header right on desktop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:flex lg:gap-10 lg:items-stretch"
        >
          <div className="lg:w-[55%] flex-shrink-0">
            <HeroImage imageUrl={experience.image_url} alt={experience.title} />
          </div>
          <div className="mt-4 lg:mt-0 lg:w-[45%] lg:flex lg:flex-col lg:justify-center">
            <ExperienceHeader
              title={experience.title}
              categoryName={experience.category_name ?? experience.category}
              cityName={experience.city_name ?? experience.city}
              defaultHours={experience.default_hours ?? null}
              avgRating={avgRating}
              reviewCount={reviewCount}
              description={experience.description}
            />
          </div>
        </motion.div>

        <Separator className="my-8" />

        {/* Two-column layout: content + sticky sidebar */}
        <div className="lg:flex lg:gap-12">
          <div className="flex-1 min-w-0 space-y-8">
            {experience.description && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <WhatYouWillDo description={experience.description} />
              </motion.div>
            )}

            {experience.participant_info && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <ParticipantInfo info={experience.participant_info} />
              </motion.div>
            )}

            {experience.secondary_tags && experience.secondary_tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <TagsSection tags={experience.secondary_tags} />
              </motion.div>
            )}

            {reviews.length > 0 && avgRating !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ReviewsSection
                  reviews={reviews}
                  avgRating={avgRating}
                  totalCount={reviewCount}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <MeetingPlace
                address={experience.address}
                cityName={experience.city_name ?? experience.city}
              />
            </motion.div>

            {experience.sdgs && experience.sdgs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <SdgSection sdgs={experience.sdgs} />
              </motion.div>
            )}

            {experience.association_name && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <AssociationProfile
                  id={experience.association_id ?? null}
                  name={experience.association_name}
                  logoUrl={experience.association_logo_url ?? null}
                  description={experience.association_description ?? null}
                />
              </motion.div>
            )}

          </div>

          {/* Desktop sidebar */}
          <motion.div
            className="hidden lg:block w-[380px] flex-shrink-0 sticky top-24 self-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DatesSidebar {...dateProps} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <RelatedExperiences
            currentExperienceId={experience.id}
            cityId={experience.city_id ?? null}
            companyId={profile?.company_id ?? null}
          />
        </motion.div>
      </div>

      {/* Mobile sticky CTA */}
      {isMobile && (
        <>
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border z-40">
            <Button
              onClick={() => setDrawerOpen(true)}
              className="w-full h-12 text-base font-medium rounded-xl"
            >
              Vedi date disponibili
            </Button>
          </div>

          <MobileDateDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            {...dateProps}
          />
        </>
      )}
    </AppLayout>
  );
}
