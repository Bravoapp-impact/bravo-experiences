/**
 * Query key factory for the `gallery_photos` entity.
 * Pattern: `[entity, operation, ...params]` — see docs/data-fetching.md.
 */

export const galleryKeys = {
  all: ["gallery"] as const,

  myPhotos: (userId: string) =>
    [...galleryKeys.all, "my", userId] as const,

  countForEvent: (userId: string, experienceDateId: string) =>
    [...galleryKeys.all, "count", userId, experienceDateId] as const,

  signedUrls: (paths: string[]) =>
    [...galleryKeys.all, "signed", paths] as const,
};
