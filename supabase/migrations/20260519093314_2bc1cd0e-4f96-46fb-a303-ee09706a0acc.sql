DROP TRIGGER IF EXISTS gallery_photos_storage_cleanup ON public.gallery_photos;
DROP FUNCTION IF EXISTS public.cleanup_gallery_photo_storage();