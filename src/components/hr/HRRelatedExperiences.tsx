import { RelatedExperiencesList } from "@/components/experience-detail/RelatedExperiencesList";
import { useRelatedExperiencesForHR } from "@/hooks/useRelatedExperiences";

interface HRRelatedExperiencesProps {
  currentExperienceId: string;
  cityId: string | null;
  companyId: string | null;
  cityName?: string | null;
}

/**
 * HR-context wrapper: fetches related experiences in the same city that are
 * NOT yet in the HR's company program — discovery surface for activation.
 */
export function HRRelatedExperiences({
  currentExperienceId,
  cityId,
  companyId,
  cityName,
}: HRRelatedExperiencesProps) {
  const { experiences, loading } = useRelatedExperiencesForHR({
    currentExperienceId,
    cityId,
    companyId,
  });

  return (
    <RelatedExperiencesList
      experiences={experiences}
      loading={loading}
      title={cityName ? `Altre esperienze da attivare a ${cityName}` : "Altre esperienze da attivare"}
      linkPrefix="/hr/experiences"
    />
  );
}
