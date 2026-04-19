import { RelatedExperiencesList } from "./RelatedExperiencesList";
import { useRelatedExperiencesForEmployee } from "@/hooks/queries/experiences/useRelatedExperiences";

interface RelatedExperiencesProps {
  currentExperienceId: string;
  cityId: string | null;
  companyId: string | null;
  cityName?: string | null;
}

/**
 * Employee-context wrapper: fetches related experiences activated for the
 * user's company in the same city, then delegates rendering to the pure list.
 */
export function RelatedExperiences({
  currentExperienceId,
  cityId,
  companyId,
  cityName,
}: RelatedExperiencesProps) {
  const { data: experiences = [], isLoading } = useRelatedExperiencesForEmployee({
    currentExperienceId,
    cityId,
    companyId,
  });

  return (
    <RelatedExperiencesList
      experiences={experiences}
      loading={isLoading}
      title={cityName ? `Altre esperienze a ${cityName}` : "Altre esperienze nella stessa città"}
    />
  );
}
