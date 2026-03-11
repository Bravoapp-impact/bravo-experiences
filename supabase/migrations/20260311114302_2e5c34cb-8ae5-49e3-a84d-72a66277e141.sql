
-- Sprint 3: Booking lifecycle — process_completed_events function
-- ROLLBACK: DROP FUNCTION IF EXISTS public.process_completed_events();
--           Revert RLS: recreate old policy with status = 'confirmed' only

-- Function to transition past confirmed bookings to completed
-- Events that ended more than 2 hours ago are transitioned
CREATE OR REPLACE FUNCTION public.process_completed_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.bookings b
  SET status = 'completed'
  FROM public.experience_dates ed
  WHERE b.experience_date_id = ed.id
    AND b.status = 'confirmed'
    AND ed.end_datetime < (now() - interval '2 hours')
  ;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Update experience_reviews INSERT policy to accept 'completed' status too
DROP POLICY IF EXISTS "Users can insert review for own past booking" ON public.experience_reviews;
CREATE POLICY "Users can insert review for own past booking"
  ON public.experience_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM bookings b
      JOIN experience_dates ed ON b.experience_date_id = ed.id
      WHERE b.id = experience_reviews.booking_id
        AND b.user_id = auth.uid()
        AND b.status IN ('confirmed', 'completed')
        AND ed.start_datetime < now()
    )
  );
