
-- Sprint 3: Expand bookings status CHECK constraint to support 5 states
-- ROLLBACK: ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
--           ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('confirmed', 'cancelled'));

ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('confirmed', 'verified', 'completed', 'cancelled', 'no_show'));
