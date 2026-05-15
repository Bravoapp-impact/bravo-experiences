import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

import { HeroImage } from "./HeroImage";
import { ExperienceHeader } from "./ExperienceHeader";
import { WhatYouWillDo } from "./WhatYouWillDo";
import { ParticipantInfo } from "./ParticipantInfo";
import { TagsSection } from "./TagsSection";
import { ReviewsSection } from "./ReviewsSection";
import { MeetingPlace } from "./MeetingPlace";
import { SdgSection } from "./SdgSection";
import { AssociationProfile } from "./AssociationProfile";
import { RelatedExperiences } from "./RelatedExperiences";
import { UpcomingDatesSection, type UpcomingDateItem } from "./UpcomingDatesSection";

import type { Experience, ExperienceReview } from "@/types/experiences";

interface ExperienceDetailContentProps {
  experience: Experience;
  reviews: ExperienceReview[];
  avgRating: number | null;
  reviewCount: number;
  /** Company id used by the default employee related-experiences block. */
  relatedCompanyId?: string | null;
  /** Optional right-column slot (e.g. DatesSidebar for employees). */
  sidebarSlot?: ReactNode;
  /** Optional slot rendered at the very end (e.g. MobileDateDrawer). */
  mobileDrawerSlot?: ReactNode;
  /**
   * Optional list of upcoming dates rendered as an informational
   * "Quando si svolge" section in the main column (after MeetingPlace).
   * Used by HR/association detail pages where there is no booking sidebar.
   * If omitted, the section is not rendered (employee context).
   */
  upcomingDates?: UpcomingDateItem[];
  /**
   * Optional override for the related-experiences block. If provided, this
   * node is rendered in place of the default employee block — used by HR
   * to show "esperienze da attivare" instead of "esperienze nella tua azienda".
   */
  relatedExperiencesSlot?: ReactNode;
  /**
   * If false, hides the related-experiences block entirely (HR informational view).
   * Defaults to true.
   */
  showRelatedExperiences?: boolean;
}

/**
 * Shared, role-agnostic content for the experience detail page.
 * Pure presentation: receives already-loaded data and slot nodes,
 * does no fetching and contains no role-specific conditionals.
 */
export function ExperienceDetailContent({
  experience,
  reviews,
  avgRating,
  reviewCount,
  relatedCompanyId = null,
  sidebarSlot,
  mobileDrawerSlot,
  upcomingDates,
  relatedExperiencesSlot,
  showRelatedExperiences = true,
}: ExperienceDetailContentProps) {
  return (
    <>
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
            locationType={experience.location_type ?? null}
          />
        </div>
      </motion.div>

      {/* Two-column layout: content + optional sticky sidebar */}
      <div className="lg:flex lg:gap-12 mt-10">
        <div className="flex-1 min-w-0">
          {experience.description && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Separator className="my-8 lg:hidden" />
              <WhatYouWillDo description={experience.description} />
            </motion.div>
          )}

          {experience.secondary_tags && experience.secondary_tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Separator className="my-8" />
              <TagsSection tags={experience.secondary_tags} />
            </motion.div>
          )}

          {reviews.length > 0 && avgRating !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Separator className="my-8" />
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
            <Separator className="my-8" />
            <MeetingPlace
              address={experience.address}
              cityName={experience.city_name ?? experience.city}
            />
          </motion.div>

          {upcomingDates && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
            >
              <Separator className="my-8" />
              <UpcomingDatesSection dates={upcomingDates} />
            </motion.div>
          )}

          {experience.sdgs && experience.sdgs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Separator className="my-8" />
              <SdgSection sdgs={experience.sdgs} />
            </motion.div>
          )}

          {experience.association_name && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Separator className="my-8" />
              <AssociationProfile
                id={experience.association_id ?? null}
                name={experience.association_name}
                logoUrl={experience.association_logo_url ?? null}
                description={experience.association_description ?? null}
              />
            </motion.div>
          )}

          {showRelatedExperiences && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Separator className="my-8" />
              {relatedExperiencesSlot ?? (
                <RelatedExperiences
                  currentExperienceId={experience.id}
                  cityId={experience.city_id ?? null}
                  companyId={relatedCompanyId}
                  cityName={experience.city_name ?? experience.city ?? null}
                />
              )}
            </motion.div>
          )}
        </div>

        {sidebarSlot}
      </div>

      {experience.participant_info && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Separator className="my-8" />
          <ParticipantInfo info={experience.participant_info} />
        </motion.div>
      )}

      {mobileDrawerSlot}
    </>
  );
}
