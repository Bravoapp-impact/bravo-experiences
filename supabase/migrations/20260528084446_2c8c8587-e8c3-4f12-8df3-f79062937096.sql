ALTER TABLE public.profiles DROP CONSTRAINT profiles_gender_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_gender_check
  CHECK (gender IS NULL OR gender IN ('m', 'f', 'x'));