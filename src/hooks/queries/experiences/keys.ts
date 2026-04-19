/**
 * Query key factory for the `experiences` entity.
 *
 * Pattern: `[entity, operation, ...params]` — see docs/data-fetching.md.
 *
 * Designed so that future mutations (e.g. activate/deactivate experience for
 * a company, edit experience detail) can invalidate the right slice without
 * having to spell out the key shape:
 *
 *   queryClient.invalidateQueries({ queryKey: experienceKeys.all })
 *   queryClient.invalidateQueries({ queryKey: experienceKeys.related() })
 */

export interface RelatedExperiencesParams {
  currentExperienceId: string;
  cityId: string | null;
  companyId: string | null;
}

export const experienceKeys = {
  all: ["experiences"] as const,

  lists: () => [...experienceKeys.all, "list"] as const,
  list: (filters: { cityId?: string | null; companyId?: string | null }) =>
    [...experienceKeys.lists(), filters] as const,

  details: () => [...experienceKeys.all, "detail"] as const,
  detail: (id: string) => [...experienceKeys.details(), id] as const,

  related: () => [...experienceKeys.all, "related"] as const,
  relatedFor: (
    ctx: "employee" | "hr",
    params: RelatedExperiencesParams,
  ) => [...experienceKeys.related(), ctx, params] as const,
};
