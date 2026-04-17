import { RelatedExperiencesList } from "./RelatedExperiencesList";
import { useRelatedExperiencesForEmployee } from "@/hooks/useRelatedExperiences";

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
  const { experiences, loading } = useRelatedExperiencesForEmployee({
    currentExperienceId,
    cityId,
    companyId,
  });

  return (
    <RelatedExperiencesList
      experiences={experiences}
      loading={loading}
      title={cityName ? `Altre esperienze a ${cityName}` : "Altre esperienze nella stessa città"}
    />
  );
}
