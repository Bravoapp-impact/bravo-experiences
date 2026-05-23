ALTER TABLE public.experience_reviews
ADD COLUMN feedback_positive_tags text[] NOT NULL DEFAULT '{}';