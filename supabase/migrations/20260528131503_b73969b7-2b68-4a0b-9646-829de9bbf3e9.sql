CREATE OR REPLACE FUNCTION public.is_booking_cancellable(booking_uuid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.experience_dates ed ON b.experience_date_id = ed.id
    WHERE b.id = booking_uuid AND ed.start_datetime > (now() + interval '14 days')
  );
$function$;