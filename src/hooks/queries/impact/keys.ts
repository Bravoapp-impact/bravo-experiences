/**
 * Query key factory for the `impact` entity.
 *
 * Pattern: `[entity, operation, ...params]` — see docs/data-fetching.md.
 */

export const impactKeys = {
  all: ["impact"] as const,

  user: () => [...impactKeys.all, "user"] as const,
  userFor: (userId: string) => [...impactKeys.user(), userId] as const,

  kpiContributions: () => [...impactKeys.all, "kpi-contributions"] as const,
  kpiContributionsFor: (userId: string) =>
    [...impactKeys.kpiContributions(), userId] as const,
};
