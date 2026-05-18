/**
 * Query key factory for the `gallery_photos` entity.
 * Pattern: `[entity, operation, ...params]` — see docs/data-fetching.md.
 */

export interface CompanyGalleryFilters {
  experienceIds?: string[];
  associationIds?: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
  onlyFeatured?: boolean;
  includeHidden?: boolean;
}

export const galleryKeys = {
  all: ["gallery"] as const,

  myPhotos: (userId: string) =>
    [...galleryKeys.all, "my", userId] as const,

  countForEvent: (userId: string, experienceDateId: string) =>
    [...galleryKeys.all, "count", userId, experienceDateId] as const,

  signedUrls: (paths: string[]) =>
    [...galleryKeys.all, "signed", paths] as const,

  // Company-wide (HR / super admin views)
  companyAll: (companyId: string) =>
    [...galleryKeys.all, "company", companyId] as const,
  companyGallery: (companyId: string, filters: CompanyGalleryFilters) =>
    [...galleryKeys.companyAll(companyId), "list", filters] as const,
  pendingPhotos: (companyId: string) =>
    [...galleryKeys.companyAll(companyId), "pending"] as const,
  featuredPhotos: (companyId: string) =>
    [...galleryKeys.companyAll(companyId), "featured"] as const,
};
