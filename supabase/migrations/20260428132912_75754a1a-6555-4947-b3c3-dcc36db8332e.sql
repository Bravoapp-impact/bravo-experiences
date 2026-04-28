UPDATE public.tb_formats SET image_url = CASE
  WHEN title ILIKE '%cooking%' OR title ILIKE '%cucina%' OR title ILIKE '%pasta%' THEN 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80'
  WHEN title ILIKE '%apicoltura%' OR title ILIKE '%api %' OR title ILIKE '% api' THEN 'https://images.unsplash.com/photo-1568526381923-caf3fd520382?w=1200&q=80'
  WHEN title ILIKE '%teatr%' OR title ILIKE '%storytelling%' OR title ILIKE '%public speaking%' THEN 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&q=80'
  WHEN title ILIKE '%trekking%' OR title ILIKE '%clean-up%' OR title ILIKE '%urbano%' THEN 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80'
  WHEN title ILIKE '%agricoltura%' OR title ILIKE '%fattoria%' OR title ILIKE '%natura%' OR title ILIKE '%nature%' THEN 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80'
  WHEN title ILIKE '%kit%' OR title ILIKE '%solidale%' OR title ILIKE '%solidariet%' THEN 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80'
  WHEN title ILIKE '%sport%' OR title ILIKE '%inclusiv%' THEN 'https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1200&q=80'
  WHEN title ILIKE '%kokedama%' OR title ILIKE '%green%' OR title ILIKE '%cartapesta%' OR title ILIKE '%creativ%' OR title ILIKE '%artigianato%' THEN 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80'
  WHEN title ILIKE '%workshop%' OR title ILIKE '%coaching%' OR title ILIKE '%decision%' THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80'
  WHEN title ILIKE '%riqualificazione%' OR title ILIKE '%bene comune%' THEN 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80'
  ELSE 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80'
END
WHERE image_url IS NULL;