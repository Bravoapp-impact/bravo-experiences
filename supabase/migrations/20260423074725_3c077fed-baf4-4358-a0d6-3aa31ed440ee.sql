
-- Add location_type column to experiences
ALTER TABLE experiences ADD COLUMN location_type text NOT NULL DEFAULT 'both';

-- Migrate existing tag data into the new column
UPDATE experiences SET location_type = 'indoor'
WHERE secondary_tags @> ARRAY['Indoor'] AND NOT secondary_tags @> ARRAY['Outdoor'];

UPDATE experiences SET location_type = 'outdoor'
WHERE secondary_tags @> ARRAY['Outdoor'] AND NOT secondary_tags @> ARRAY['Indoor'];

UPDATE experiences SET location_type = 'both'
WHERE secondary_tags @> ARRAY['Indoor'] AND secondary_tags @> ARRAY['Outdoor'];

-- Remove Indoor/Outdoor from secondary_tags
UPDATE experiences
SET secondary_tags = array_remove(array_remove(secondary_tags, 'Indoor'), 'Outdoor')
WHERE secondary_tags && ARRAY['Indoor', 'Outdoor'];
