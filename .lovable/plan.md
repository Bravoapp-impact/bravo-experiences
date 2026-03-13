

# Fix: Edit form fields, button cutoff, image upload

## Three bugs identified

### 1. Durata e Max partecipanti persi in modifica
The `experiences` table has no `default_hours` or `max_participants` columns. The form collects these values but they're never saved to DB, so in edit mode they're always empty.

**Fix:** Add `default_hours` (numeric) and `max_participants` (integer) columns to the `experiences` table. Update the INSERT/UPDATE queries and the form's initial data interface to read/write these fields.

### 2. Pulsante "Salva modifiche" tagliato
The form sets `sm:max-h-[85vh]` inside a modal that already constrains to `sm:max-h-[90vh]`. On mobile the form uses `h-full` but the `BaseModal` header takes space, leaving the fixed footer partially clipped.

**Fix:** Remove the redundant `sm:max-h-[85vh]` from the form wrapper and ensure the flex layout properly distributes space between scrollable content and fixed footer.

### 3. Upload immagine non funziona
The storage bucket `experience-images` only has an upload policy for `super_admin`. Association admins are blocked by RLS. The form silently returns without feedback.

**Fix:** Add a storage RLS policy allowing association admins to upload to the `experience-images` bucket (scoped to their association folder). Also add a user-visible error toast on upload failure.

## Changes

### Database migration
```sql
-- Add default_hours and max_participants to experiences
ALTER TABLE public.experiences 
  ADD COLUMN IF NOT EXISTS default_hours numeric,
  ADD COLUMN IF NOT EXISTS max_participants integer;

-- Allow association admins to upload experience images
CREATE POLICY "Association admins can upload experience images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'experience-images' 
  AND is_association_admin(auth.uid())
);

-- Allow association admins to update/delete their uploaded images
CREATE POLICY "Association admins can manage experience images"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'experience-images' 
  AND is_association_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'experience-images' 
  AND is_association_admin(auth.uid())
);
```

### File changes

| File | Change |
|------|--------|
| `ExperienceForm.tsx` | Add `default_hours`/`max_participants` to `ExperienceInitialData`; populate state from experience prop in edit mode; remove `sm:max-h-[85vh]`; show toast on upload error |
| `CreateExperienceDialog.tsx` | Add `default_hours`/`max_participants` to INSERT and UPDATE queries; add these fields to `ExperienceData` interface |
| `AssociationExperiencesPage.tsx` | No changes needed (data already fetched via `select(*)`) |

