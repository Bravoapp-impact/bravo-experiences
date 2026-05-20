import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HRLayout } from "@/components/layout/HRLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { devLog } from "@/lib/logger";
import type { Experience, ExperienceReview } from "@/types/experiences";

import { ExperienceDetailContent } from "@/components/experience-detail/ExperienceDetailContent";
import { HRSidebar, type HRSidebarDate } from "@/components/hr/HRSidebar";

export default function HRExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [upcomingDates, setUpcomingDates] = useState<HRSidebarDate[]>([]);

  // Reviews
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

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

        let assoc: { id: string; name: string; logo_url: string | null; description: string | null; website: string | null } | null = null;
        if (data.association_id) {
          const { data: assocData } = await supabase
            .from("associations_public")
            .select("id, name, logo_url, description, website")
            .eq("id", data.association_id)
            .maybeSingle();
          assoc = assocData as any;
        }
        const cat = data.categories as any;
        const city = data.cities as any;

        setExperience({
          id: data.id,
          title: data.title,
          description: data.description,
          short_description: (data as any).short_description ?? null,
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
          location_type: data.location_type ?? null,
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, [id]);

  // ─── Fetch upcoming dates + bookings count ───
  useEffect(() => {
    if (!id) return;

    const fetchDates = async () => {
      try {
        const { data: datesData, error: datesError } = await supabase
          .from("experience_dates")
          .select("id, start_datetime, end_datetime")
          .eq("experience_id", id)
          .gte("start_datetime", new Date().toISOString())
          .order("start_datetime", { ascending: true });

        if (datesError) throw datesError;

        const dateRows = datesData ?? [];
        if (dateRows.length === 0) {
          setUpcomingDates([]);
          return;
        }

        const dateIds = dateRows.map((d) => d.id);
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("experience_date_id, status")
          .in("experience_date_id", dateIds)
          .in("status", ["confirmed", "completed"]);

        if (bookingsError) throw bookingsError;

        const counts = new Map<string, number>();
        (bookingsData ?? []).forEach((b) => {
          counts.set(b.experience_date_id, (counts.get(b.experience_date_id) ?? 0) + 1);
        });

        setUpcomingDates(
          dateRows.map((d) => ({
            id: d.id,
            start_datetime: d.start_datetime,
            end_datetime: d.end_datetime,
            bookings_count: counts.get(d.id) ?? 0,
          }))
        );
      } catch (err) {
        devLog.error("Error fetching HR upcoming dates:", err);
      }
    };

    fetchDates();
  }, [id]);

  // ─── Fetch reviews (same logic as employee page) ───
  useEffect(() => {
    if (!id) return;

    const fetchReviews = async () => {
      const { data: dateIds } = await supabase
        .from("experience_dates")
        .select("id")
        .eq("experience_id", id);

      if (!dateIds?.length) return;

      const edIds = dateIds.map((d) => d.id);

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, user_id, experience_date_id")
        .in("experience_date_id", edIds);

      if (!bookingsData?.length) return;

      const bookingIds = bookingsData.map((b) => b.id);
      const bookingUserMap = new Map(bookingsData.map((b) => [b.id, b.user_id]));

      const { data: reviewsData } = await supabase
        .from("experience_reviews")
        .select("id, rating, feedback_positive, feedback_improvement, would_recommend, created_at, booking_id")
        .in("booking_id", bookingIds)
        .order("created_at", { ascending: false });

      if (!reviewsData?.length) return;

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
        const p = userId ? profileMap.get(userId) : undefined;
        return {
          id: r.id,
          rating: r.rating,
          feedback_positive: r.feedback_positive,
          feedback_improvement: r.feedback_improvement,
          would_recommend: r.would_recommend,
          created_at: r.created_at,
          reviewer_name: p
            ? [p.first_name, p.last_name].filter(Boolean).join(" ") || null
            : null,
          reviewer_avatar: p?.avatar_url ?? null,
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

  const goBack = () => navigate("/hr/volontariato");

  // ─── Loading ───
  if (loading) {
    return (
      <HRLayout>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6 py-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="w-full aspect-[4/3] lg:aspect-[16/10] rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </HRLayout>
    );
  }

  // ─── Not found ───
  if (notFound || !experience) {
    return (
      <HRLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-lg font-semibold mb-2">Esperienza non trovata</h2>
          <p className="text-sm text-muted-foreground mb-6">
            L'esperienza che cerchi non esiste o non è disponibile.
          </p>
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al volontariato
          </Button>
        </div>
      </HRLayout>
    );
  }

  return (
    <HRLayout>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-12">
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna al volontariato
        </button>

        <ExperienceDetailContent
          experience={experience}
          reviews={reviews}
          avgRating={avgRating}
          reviewCount={reviewCount}
          showRelatedExperiences={false}
          sidebarSlot={
            <motion.div
              className="hidden lg:block w-[380px] flex-shrink-0 sticky top-24 self-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <HRSidebar
                dates={upcomingDates}
                defaultHours={experience.default_hours ?? null}
              />
            </motion.div>
          }
        />

        {/* Mobile: stessa info sotto al contenuto */}
        <div className="lg:hidden mt-8">
          <HRSidebar
            dates={upcomingDates}
            defaultHours={experience.default_hours ?? null}
          />
        </div>
      </div>
    </HRLayout>
  );
}
