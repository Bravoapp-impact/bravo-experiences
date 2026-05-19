/**
 * Query key factory for association suggestions.
 * Pattern: [entity, operation, ...params].
 */
export const suggestionKeys = {
  all: ["suggestions"] as const,
  lists: () => [...suggestionKeys.all, "list"] as const,
  list: (companyId: string) => [...suggestionKeys.lists(), companyId] as const,
  token: (companyId: string) =>
    [...suggestionKeys.all, "token", companyId] as const,
};
