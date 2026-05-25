import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AssociationLayout } from "@/components/layout/AssociationLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { devLog } from "@/lib/logger";
import { toast } from "sonner";
import type { Experience, ExperienceReview } from "@/types/experiences";

import { ExperienceDetailContent } from "@/components/experience-detail/ExperienceDetailContent";
import type { UpcomingDateItem } from "@/components/experience-detail/UpcomingDatesSection";
import { AssociationDetailSidebar } from "@/components/association/AssociationDetailSidebar";
import { AssociationMobileEditDrawer } from "@/components/association/AssociationMobileEditDrawer";
import { CreateExperienceDialog } from "@/components/association/CreateExperienceDialog";
import { ManageDatesDialog } from "@/components/association/ManageDatesDialog";

interface ExperienceWithStatus extends Experience {
  status: string;
  category_id?: string | null;
  short_description?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Bozza",
  published: "Pubblicata",
  archived: "Archiviata",
};

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline"> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

export default function AssociationExperienceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const [experience, setExperience] = useState<ExperienceWithStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [upcomingDates, setUpcomingDates] = useState<UpcomingDateItem[]>([]);

  // Reviews
  const [reviews, setReviews] = useState<ExperienceReview[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  // Edit dialog + manage dates dialog + mobile drawer
  const [editOpen, setEditOpen] = useState(false);
  const [datesOpen, setDatesOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ─── Fetch experience ───
  const fetchExperience = useCallback(async () => {
    if (!id || !profile?.association_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          *,
          associations:association_id (
            id, name, logo_url, description, website
          ),
          categories:category_id (id, name),
          cities:city_id (name)
        `)
        .eq("id", id)
        .eq("association_id", profile.association_id)
        .maybeSingle();

      if (error || !data) {
        toast.error("Esperienza non trovata o non accessibile");
        navigate("/association/experiences", { replace: true });
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
        category_id: cat?.id ?? data.category_id,
        sdgs: data.sdgs ?? [],
        participant_info: data.participant_info ?? null,
        default_hours: data.default_hours,
        secondary_tags: data.secondary_tags ?? null,
        location_type: data.location_type ?? null,
        short_description: (data as any).short_description ?? null,
        status: data.status,
      });
    } catch (err) {
      devLog.error("Error fetching association experience:", err);
      toast.error("Errore nel caricamento dell'esperienza");
      navigate("/association/experiences", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, profile?.association_id, navigate]);

  useEffect(() => {
    fetchExperience();
  }, [fetchExperience]);

  // ─── Fetch upcoming dates ───
  useEffect(() => {
    if (!id) return;

    const fetchDates = async () => {
      try {
        const { data, error } = await supabase
          .from("experience_dates")
          .select("id, start_datetime, end_datetime, volunteer_hours")
          .eq("experience_id", id)
          .gte("start_datetime", new Date().toISOString())
          .order("start_datetime", { ascending: true });

        if (error) throw error;

        setUpcomingDates(
          (data || []).map((d) => ({
            id: d.id,
            start_datetime: d.start_datetime,
            end_datetime: d.end_datetime,
            volunteer_hours: d.volunteer_hours,
          }))
        );
      } catch (err) {
        devLog.error("Error fetching association upcoming dates:", err);
      }
    };

    fetchDates();
  }, [id]);

  // ─── Fetch reviews ───
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

  const goBack = () => navigate("/association/experiences");

  const handleOpenEdit = () => {
    setDrawerOpen(false);
    setEditOpen(true);
  };

  const handleOpenDates = () => {
    setDrawerOpen(false);
    setDatesOpen(true);
  };

  const refetchDates = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("experience_dates")
      .select("id, start_datetime, end_datetime, volunteer_hours")
      .eq("experience_id", id)
      .gte("start_datetime", new Date().toISOString())
      .order("start_datetime", { ascending: true });
    setUpcomingDates(
      (data || []).map((d) => ({
        id: d.id,
        start_datetime: d.start_datetime,
        end_datetime: d.end_datetime,
        volunteer_hours: d.volunteer_hours,
      }))
    );
  }, [id]);

  // ─── Loading ───
  if (loading) {
    return (
      <AssociationLayout>
        <div className="max-w-6xl mx-auto px-4 lg:px-8 space-y-6 py-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="w-full aspect-[4/3] lg:aspect-[16/10] rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </AssociationLayout>
    );
  }

  if (!experience) return null;

  const isArchived = experience.status === "archived";

  return (
    <AssociationLayout>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-28 lg:pb-12">
        {/* Header: back + status badge */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={goBack}
            aria-label="Indietro"
            className="flex items-center justify-center h-10 w-10 rounded-full bg-muted hover:bg-muted/70 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          {experience.status && (
            <Badge variant={STATUS_VARIANT[experience.status] ?? "outline"}>
              {STATUS_LABEL[experience.status] ?? experience.status}
            </Badge>
          )}
        </div>

        <ExperienceDetailContent
          experience={experience}
          reviews={reviews}
          avgRating={avgRating}
          reviewCount={reviewCount}
          relatedCompanyId={null}
          upcomingDates={upcomingDates}
          sidebarSlot={
            <motion.div
              className="hidden lg:block w-[380px] flex-shrink-0 sticky top-24 self-start"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AssociationDetailSidebar
                status={experience.status}
                onEdit={handleOpenEdit}
                onManageDates={handleOpenDates}
              />
            </motion.div>
          }
        />
      </div>

      {/* Mobile sticky CTA — hidden when archived */}
      {isMobile && !isArchived && (
        <>
          <div className="fixed bottom-20 left-0 right-0 px-4 z-40 pointer-events-none">
            <Button
              onClick={() => setDrawerOpen(true)}
              className="pointer-events-auto w-full h-12 text-base font-medium rounded-xl shadow-lg shadow-primary/25"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Modifica esperienza
            </Button>
          </div>

          <AssociationMobileEditDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onEdit={handleOpenEdit}
            onManageDates={handleOpenDates}
          />
        </>
      )}

      {/* Edit dialog — reuse the existing CreateExperienceDialog */}
      <CreateExperienceDialog
        open={editOpen}
        onOpenChange={(open) => setEditOpen(open)}
        onCreated={() => {
          setEditOpen(false);
          fetchExperience();
        }}
        experience={
          experience
            ? {
                id: experience.id,
                title: experience.title,
                short_description: experience.short_description ?? null,
                description: experience.description,
                category_id: experience.category_id ?? null,
                city_id: experience.city_id ?? null,
                address: experience.address,
                default_hours: experience.default_hours ?? null,
                participant_info: experience.participant_info ?? null,
                image_url: experience.image_url,
              }
            : undefined
        }
        isPublished={experience.status === "published"}
      />

      {/* Manage dates dialog */}
      {experience && (
        <ManageDatesDialog
          open={datesOpen}
          onOpenChange={(open) => {
            setDatesOpen(open);
            if (!open) refetchDates();
          }}
          experienceId={experience.id}
          experienceTitle={experience.title}
          defaultMaxParticipants={null}
        />
      )}
    </AssociationLayout>
  );
}
